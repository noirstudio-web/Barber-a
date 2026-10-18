"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { planes, type Plan } from "@/config/planes";
import { getDb } from "@/db";
import { barberias } from "@/db/schema";
import { cancelarDebitoAutomatico, crearDebitoAutomatico, crearLinkDePago, mpConfigurado } from "@/lib/mercadopago";
import { exigirDueno } from "@/lib/sesion";
import { urlSitio } from "@/lib/url";
import type { EstadoFormulario } from "../../acciones";

const planPagable = z.enum(["basico", "premium"]);

// Pago único del mes con Checkout Pro: lleva al dueño a Mercado Pago
export async function pagarPlan(plan: Plan) {
  const { barberia } = await exigirDueno({ permitirVencida: true });
  if (!mpConfigurado() || !planPagable.safeParse(plan).success) redirect("/admin/suscripcion?pago=no-disponible");
  const base = await urlSitio();
  const link = await crearLinkDePago({
    titulo: `Plan ${planes[plan].nombre} - ${barberia.nombre} (1 mes)`,
    precio: planes[plan].precio,
    referencia: `renovacion:${barberia.id}:${plan}`,
    urlBase: base,
    urlRegreso: `${base}/admin/suscripcion`,
  });
  redirect(link);
}

// Débito automático mensual con tarjeta (preapproval de Mercado Pago)
export async function activarDebito(_: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const { barberia } = await exigirDueno({ permitirVencida: true });
  if (!mpConfigurado()) return { error: "Los pagos en línea todavía no están disponibles." };
  const plan = planPagable.safeParse(form.get("plan"));
  const email = z.string().trim().email().safeParse(form.get("email"));
  if (!plan.success) return { error: "Elige un plan." };
  if (!email.success) return { error: "Escribe el correo de tu cuenta de Mercado Pago." };

  const base = await urlSitio();
  let link: string;
  try {
    const s = await crearDebitoAutomatico({
      titulo: `Noir Studio - Plan ${planes[plan.data].nombre} - ${barberia.nombre}`,
      precio: planes[plan.data].precio,
      referencia: `debito:${barberia.id}:${plan.data}`,
      email: email.data,
      urlRegreso: `${base}/admin/suscripcion?debito=1`,
    });
    const db = await getDb();
    await db
      .update(barberias)
      .set({ mpSuscripcionId: s.id, mpSuscripcionEstado: s.status, mpSuscripcionPlan: plan.data })
      .where(eq(barberias.id, barberia.id));
    link = s.init_point;
  } catch (e) {
    console.error("No se pudo crear el débito automático", e);
    return { error: "Mercado Pago no pudo crear el débito automático. Revisa el correo e inténtalo de nuevo." };
  }
  redirect(link);
}

export async function cancelarDebito() {
  const { barberia } = await exigirDueno({ permitirVencida: true });
  if (!barberia.mpSuscripcionId) return;
  try {
    await cancelarDebitoAutomatico(barberia.mpSuscripcionId);
  } catch (e) {
    console.error("No se pudo cancelar el débito automático en Mercado Pago", e);
  }
  const db = await getDb();
  await db.update(barberias).set({ mpSuscripcionEstado: "cancelled" }).where(eq(barberias.id, barberia.id));
  revalidatePath("/admin/suscripcion");
}
