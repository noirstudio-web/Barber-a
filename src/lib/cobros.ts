import { randomInt } from "node:crypto";
import { eq } from "drizzle-orm";
import { revalidatePath as revalidar } from "next/cache";
import { PLANES, planes, type Plan } from "@/config/planes";
import { getDb, type Db } from "@/db";
import { barberias, codigos, compras, pagos } from "@/db/schema";
import { nuevoVencimiento } from "./barberias";
import { obtenerCobroAutomatico, obtenerPago, obtenerSuscripcion, type PagoMp } from "./mercadopago";

// revalidatePath no se puede llamar mientras se dibuja una página (regreso de Mercado Pago);
// esas páginas leen datos frescos de todas formas, así que ahí se ignora.
function revalidatePath(ruta: string, tipo?: "layout" | "page") {
  try {
    revalidar(ruta, tipo);
  } catch {
    // durante el render: no hace falta
  }
}

function refrescarPaneles(slug?: string) {
  revalidatePath("/noir", "layout");
  revalidatePath("/admin", "layout");
  if (slug) revalidatePath(`/${slug}`, "layout");
}

// Referencias que viajan en external_reference para saber qué se está pagando:
//   renovacion:<barberiaId>:<plan>   el dueño paga su plan desde el panel
//   compra:<compraId>                alguien compra un plan en la página de venta
//   debito:<barberiaId>:<plan>       débito automático mensual
export type Referencia =
  | { tipo: "renovacion"; barberiaId: number; plan: Plan }
  | { tipo: "debito"; barberiaId: number; plan: Plan }
  | { tipo: "compra"; compraId: string };

export function leerReferencia(ref: string | null | undefined): Referencia | null {
  const [tipo, a, b] = (ref ?? "").split(":");
  if (tipo === "compra" && a) return { tipo, compraId: a };
  if ((tipo === "renovacion" || tipo === "debito") && Number(a) > 0 && PLANES.includes(b as Plan)) {
    return { tipo, barberiaId: Number(a), plan: b as Plan };
  }
  return null;
}

function nuevoCodigo() {
  const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bloque = () => Array.from({ length: 4 }, () => letras[randomInt(letras.length)]).join("");
  return `NOIR-${bloque()}-${bloque()}`;
}

function nombrePagador(p: PagoMp) {
  return [p.payer?.first_name, p.payer?.last_name].filter(Boolean).join(" ") || p.payer?.email || "";
}

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

// Suma los días del plan a una barbería y la reactiva si estaba cancelada
async function renovar(tx: Tx, barberiaId: number, plan: Plan) {
  const [b] = await tx.select().from(barberias).where(eq(barberias.id, barberiaId));
  if (!b) return null;
  const venceEn = nuevoVencimiento(b.plan === plan && !b.canceladaEn ? b.venceEn : null, planes[plan].dias);
  await tx.update(barberias).set({ plan, venceEn, canceladaEn: null, motivoCancelacion: "" }).where(eq(barberias.id, barberiaId));
  return b.slug;
}

// Registra un pago aprobado de Mercado Pago y aplica su efecto (renovar o crear la licencia).
// El pago y su efecto van en la misma transacción, y el índice único de mp_pago_id hace que
// se apliquen una sola vez aunque Mercado Pago notifique varias veces.
export async function procesarPago(paymentId: string | number): Promise<
  { estado: "aprobado"; referencia: Referencia } | { estado: "pendiente" | "rechazado" | "desconocido" }
> {
  const pago = await obtenerPago(paymentId);
  const ref = leerReferencia(pago.external_reference);
  if (!ref) return { estado: "desconocido" };
  if (pago.status === "pending" || pago.status === "in_process") return { estado: "pendiente" };
  if (pago.status !== "approved") return { estado: "rechazado" };

  const db = await getDb();
  const compra = ref.tipo === "compra" ? (await db.select().from(compras).where(eq(compras.id, ref.compraId)))[0] : null;
  const plan = ref.tipo === "compra" ? compra?.plan : ref.plan;
  if (!plan) return { estado: "desconocido" };
  // Protección: el monto debe corresponder al precio del plan
  if (pago.currency_id !== "COP" || pago.transaction_amount + 1 < planes[plan].precio) {
    console.error("Pago de Mercado Pago con monto inesperado", pago.id, pago.transaction_amount, pago.currency_id);
    return { estado: "rechazado" };
  }

  const slug = await db.transaction(async (tx) => {
    const [nuevo] = await tx
      .insert(pagos)
      .values({
        barberiaId: ref.tipo === "compra" ? null : ref.barberiaId,
        cliente: compra?.nombre ?? nombrePagador(pago),
        plan,
        montoCentavos: Math.round(pago.transaction_amount * 100),
        moneda: "COP",
        metodo: "Mercado Pago",
        referencia: `MP ${pago.id}${pago.payment_method_id ? ` (${pago.payment_method_id})` : ""}`,
        mpPagoId: String(pago.id),
        fecha: pago.date_approved ? new Date(pago.date_approved) : new Date(),
      })
      .onConflictDoNothing()
      .returning({ id: pagos.id });
    if (!nuevo) return null; // ya procesado antes

    if (ref.tipo === "compra" && compra) {
      // Cliente nuevo: se genera su licencia (código de activación)
      const [c] = await tx
        .insert(codigos)
        .values({ codigo: nuevoCodigo(), plan: compra.plan, dias: planes[compra.plan].dias, nota: `${compra.nombre} (Mercado Pago)` })
        .returning({ id: codigos.id });
      await tx.update(compras).set({ estado: "aprobada", codigoId: c.id }).where(eq(compras.id, compra.id));
      await tx.update(pagos).set({ codigoId: c.id }).where(eq(pagos.id, nuevo.id));
      return "";
    }
    if (ref.tipo !== "compra") return (await renovar(tx, ref.barberiaId, ref.plan)) ?? "";
    return "";
  });
  if (slug !== null) refrescarPaneles(slug || undefined);
  return { estado: "aprobado", referencia: ref };
}

// Cambios de estado del débito automático (autorizado, pausado, cancelado)
export async function procesarSuscripcion(preapprovalId: string) {
  const s = await obtenerSuscripcion(preapprovalId);
  const ref = leerReferencia(s.external_reference);
  if (!ref || ref.tipo !== "debito") return;
  const db = await getDb();
  await db
    .update(barberias)
    .set({ mpSuscripcionId: s.id, mpSuscripcionEstado: s.status, mpSuscripcionPlan: ref.plan })
    .where(eq(barberias.id, ref.barberiaId));
  refrescarPaneles();
}

// Cada cobro mensual del débito automático: si se aprobó, registra el pago y renueva
export async function procesarCobroAutomatico(id: string) {
  const cobro = await obtenerCobroAutomatico(id);
  if (!cobro.payment || cobro.payment.status !== "approved") return;
  const s = await obtenerSuscripcion(cobro.preapproval_id);
  const ref = leerReferencia(s.external_reference);
  if (!ref || ref.tipo !== "debito") return;
  const pagoId = cobro.payment.id;

  const db = await getDb();
  const slug = await db.transaction(async (tx) => {
    const [b] = await tx.select().from(barberias).where(eq(barberias.id, ref.barberiaId));
    if (!b) return null;
    const [nuevo] = await tx
      .insert(pagos)
      .values({
        barberiaId: b.id,
        cliente: b.nombre,
        plan: ref.plan,
        montoCentavos: Math.round(cobro.transaction_amount * 100),
        moneda: "COP",
        metodo: "Mercado Pago",
        referencia: `Débito automático MP ${pagoId}`,
        mpPagoId: String(pagoId),
      })
      .onConflictDoNothing()
      .returning({ id: pagos.id });
    if (!nuevo) return null;
    return renovar(tx, b.id, ref.plan);
  });
  if (slug) refrescarPaneles(slug);
}
