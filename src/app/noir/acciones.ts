"use server";

import { randomBytes, randomInt } from "node:crypto";
import { and, count, eq, isNull, not } from "drizzle-orm";
import { del, list } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { METODOS_PAGO, PLANES, planes, type Plan } from "@/config/planes";
import { getDb } from "@/db";
import { barberias, bloqueos, citas, codigos, pagos, usuarios } from "@/db/schema";
import { nuevoVencimiento } from "@/lib/barberias";
import { exigirNoir, guardarSesion, hashClave, verComoNoir } from "@/lib/sesion";
import { codigoMaestroCorrecto } from "@/lib/token";
import type { EstadoFormulario } from "../admin/acciones";

const texto = (form: FormData, campo: string) => String(form.get(campo) ?? "").trim();

const esquemaCuenta = z.object({
  nombre: z.string().min(2, "Escribe el nombre").max(60),
  usuario: z.string().regex(/^[a-z0-9._-]{3,30}$/, "El usuario debe tener de 3 a 30 letras, números, punto o guion, sin espacios"),
  clave: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(100),
});

async function hayCuentaNoir() {
  const db = await getDb();
  const [{ total }] = await db.select({ total: count() }).from(usuarios).where(eq(usuarios.rol, "noir"));
  return total > 0;
}

// Primera cuenta de Noir Studio (el creador de la plataforma). Después de esta, el registro
// público se cierra y las cuentas nuevas se crean desde el panel.
export async function registrarNoir(_: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  if (await hayCuentaNoir()) return { error: "El registro está cerrado. Pide a Noir Studio que te cree una cuenta." };
  const valores = { nombre: texto(form, "nombre"), usuario: texto(form, "usuario").toLowerCase() };
  if (!(await codigoMaestroCorrecto(texto(form, "maestro")))) return { error: "El código maestro no es correcto.", valores };
  const cuenta = esquemaCuenta.safeParse({ ...valores, clave: form.get("clave") });
  if (!cuenta.success) return { error: cuenta.error.issues[0]?.message ?? "Revisa los datos", valores };

  const db = await getDb();
  const creado = await db
    .insert(usuarios)
    .values({ nombre: cuenta.data.nombre, usuario: cuenta.data.usuario, claveHash: await hashClave(cuenta.data.clave), rol: "noir", barberiaId: null })
    .onConflictDoNothing()
    .returning({ id: usuarios.id });
  if (creado.length === 0) return { error: "Ese usuario ya existe. Elige otro.", valores };
  await guardarSesion(creado[0].id);
  redirect("/noir");
}

// Cuentas adicionales del equipo de Noir, creadas desde el panel
export async function crearUsuarioNoir(_: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  await exigirNoir();
  const valores = { nombre: texto(form, "nombre"), usuario: texto(form, "usuario").toLowerCase() };
  const cuenta = esquemaCuenta.safeParse({ ...valores, clave: form.get("clave") });
  if (!cuenta.success) return { error: cuenta.error.issues[0]?.message ?? "Revisa los datos", valores };
  const db = await getDb();
  const creado = await db
    .insert(usuarios)
    .values({ nombre: cuenta.data.nombre, usuario: cuenta.data.usuario, claveHash: await hashClave(cuenta.data.clave), rol: "noir", barberiaId: null })
    .onConflictDoNothing()
    .returning({ id: usuarios.id });
  if (creado.length === 0) return { error: "Ese usuario ya existe. Elige otro.", valores };
  revalidatePath("/noir/cuenta");
  return { ok: `Cuenta creada para ${cuenta.data.nombre}.` };
}

export async function eliminarUsuarioNoir(id: number) {
  const yo = await exigirNoir();
  if (id === yo.id) return;
  const db = await getDb();
  await db.delete(usuarios).where(and(eq(usuarios.id, id), eq(usuarios.rol, "noir")));
  revalidatePath("/noir/cuenta");
}

// ---------------------------------------------------------------------------
// Pagos
// ---------------------------------------------------------------------------

// "35", "35.5" o "35,50" -> 3550 centavos
function centavos(valor: string): number | null {
  const n = Number(valor.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 && n < 100_000 ? Math.round(n * 100) : null;
}

type DatosPago = { plan: Plan; cliente: string; montoCentavos: number; metodo: string; referencia: string };

function leerPago(form: FormData, plan: Plan): DatosPago | string {
  const monto = centavos(texto(form, "monto") || String(planes[plan].precioUsd));
  if (monto === null) return "Escribe un monto válido en dólares.";
  const metodo = texto(form, "metodo");
  return {
    plan,
    cliente: texto(form, "cliente").slice(0, 80),
    montoCentavos: monto,
    metodo: (METODOS_PAGO as readonly string[]).includes(metodo) ? metodo : "Otro",
    referencia: texto(form, "referencia").slice(0, 80),
  };
}

// Sin letras que se confunden (O/0, I/1)
function nuevoCodigo() {
  const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bloque = () => Array.from({ length: 4 }, () => letras[randomInt(letras.length)]).join("");
  return `NOIR-${bloque()}-${bloque()}`;
}

export type EstadoCodigo = EstadoFormulario & { codigo?: string; plan?: Plan; dias?: number; nota?: string };

// Genera un código de activación y, si el cliente ya pagó, deja el pago registrado
export async function generarCodigo(_: EstadoCodigo, form: FormData): Promise<EstadoCodigo> {
  const yo = await exigirNoir();
  const plan = texto(form, "plan") as Plan;
  if (!PLANES.includes(plan)) return { error: "Elige un plan." };
  const dias = Number(form.get("dias")) || planes[plan].dias;
  if (!Number.isInteger(dias) || dias < 1 || dias > 400) return { error: "Los días deben estar entre 1 y 400." };
  const nota = texto(form, "cliente").slice(0, 80);
  const pagado = form.get("pagado") === "on";
  const pago = pagado ? leerPago(form, plan) : null;
  if (typeof pago === "string") return { error: pago };

  const db = await getDb();
  // Reintenta en el caso (muy raro) de que el código ya exista
  for (let intento = 0; intento < 5; intento++) {
    const codigo = nuevoCodigo();
    const [creado] = await db.insert(codigos).values({ codigo, plan, dias, nota }).onConflictDoNothing().returning({ id: codigos.id });
    if (creado) {
      if (pago) await db.insert(pagos).values({ ...pago, codigoId: creado.id, registradoPor: yo.id });
      revalidatePath("/noir", "layout");
      return { ok: pago ? "Código creado y pago registrado." : "Código creado.", codigo, plan, dias, nota };
    }
  }
  return { error: "No se pudo crear el código. Inténtalo de nuevo." };
}

// Pago de una barbería existente. Opcionalmente renueva: suma días, fija el plan y la reactiva.
export async function registrarPago(_: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const yo = await exigirNoir();
  const barberiaId = Number(form.get("barberiaId"));
  const plan = texto(form, "plan") as Plan;
  if (!PLANES.includes(plan)) return { error: "Elige un plan." };
  const pago = leerPago(form, plan);
  if (typeof pago === "string") return { error: pago };

  const db = await getDb();
  const [b] = barberiaId ? await db.select().from(barberias).where(eq(barberias.id, barberiaId)) : [];
  if (!b) return { error: "Elige la barbería." };
  await db.insert(pagos).values({ ...pago, cliente: pago.cliente || b.nombre, barberiaId: b.id, registradoPor: yo.id });

  const dias = Number(form.get("dias")) || 0;
  if (form.get("renovar") === "on" && dias > 0) {
    await db
      .update(barberias)
      .set({ plan, venceEn: nuevoVencimiento(b.plan === plan && !b.canceladaEn ? b.venceEn : null, dias), canceladaEn: null, motivoCancelacion: "" })
      .where(eq(barberias.id, b.id));
    revalidatePath(`/${b.slug}`, "layout");
  }
  revalidatePath("/noir", "layout");
  return { ok: form.get("renovar") === "on" ? `Pago registrado y ${b.nombre} renovada ${dias} días.` : "Pago registrado." };
}

export async function eliminarPago(id: number) {
  await exigirNoir();
  const db = await getDb();
  await db.delete(pagos).where(eq(pagos.id, id));
  revalidatePath("/noir", "layout");
}

export async function eliminarCodigo(id: number) {
  await exigirNoir();
  const db = await getDb();
  // Solo códigos sin usar; su pago (si lo tenía) queda sin código
  await db.delete(codigos).where(and(eq(codigos.id, id), isNull(codigos.usadoEn)));
  revalidatePath("/noir", "layout");
}

// ---------------------------------------------------------------------------
// Suscripciones
// ---------------------------------------------------------------------------

async function refrescar(id: number) {
  const db = await getDb();
  const [b] = await db.select({ slug: barberias.slug }).from(barberias).where(eq(barberias.id, id));
  revalidatePath("/noir", "layout");
  if (b) revalidatePath(`/${b.slug}`, "layout");
}

export async function extenderBarberia(id: number, dias: number) {
  await exigirNoir();
  const db = await getDb();
  const [b] = await db.select().from(barberias).where(eq(barberias.id, id));
  if (!b) return;
  await db.update(barberias).set({ venceEn: nuevoVencimiento(b.venceEn, dias) }).where(eq(barberias.id, id));
  await refrescar(id);
}

export async function cambiarPlanBarberia(id: number, form: FormData) {
  await exigirNoir();
  const plan = texto(form, "plan") as Plan;
  if (!PLANES.includes(plan)) return;
  const db = await getDb();
  await db.update(barberias).set({ plan }).where(eq(barberias.id, id));
  await refrescar(id);
}

export async function alternarSuspension(id: number) {
  await exigirNoir();
  const db = await getDb();
  await db.update(barberias).set({ suspendida: not(barberias.suspendida) }).where(eq(barberias.id, id));
  await refrescar(id);
}

// Cancela el plan: la web y el panel quedan en pausa (sin borrar datos) hasta reactivarla
export async function cancelarPlan(id: number, form: FormData) {
  await exigirNoir();
  const db = await getDb();
  await db
    .update(barberias)
    .set({ canceladaEn: new Date(), motivoCancelacion: texto(form, "motivo").slice(0, 160) })
    .where(eq(barberias.id, id));
  await refrescar(id);
}

export async function reactivarBarberia(id: number) {
  await exigirNoir();
  const db = await getDb();
  await db.update(barberias).set({ canceladaEn: null, motivoCancelacion: "" }).where(eq(barberias.id, id));
  await refrescar(id);
}

// ---------------------------------------------------------------------------
// Panel y cuentas de cada barbería
// ---------------------------------------------------------------------------

// Abre el panel de la barbería tal como lo ve su dueño
export async function entrarPanelBarberia(id: number) {
  await exigirNoir();
  await verComoNoir(id);
  redirect("/admin");
}

export async function salirDePanelBarberia(id: number) {
  await exigirNoir();
  await verComoNoir(null);
  redirect(`/noir/barberias/${id}`);
}

export type EstadoClave = { error?: string; clave?: string; usuario?: string };

// Contraseña temporal para un dueño o empleado que olvidó la suya
export async function restablecerClave(usuarioId: number): Promise<EstadoClave> {
  await exigirNoir();
  const db = await getDb();
  const [u] = await db.select().from(usuarios).where(eq(usuarios.id, usuarioId));
  if (!u || u.rol === "noir") return { error: "No se encontró la cuenta." };
  const clave = `Barber-${randomBytes(4).toString("hex")}`;
  await db.update(usuarios).set({ claveHash: await hashClave(clave) }).where(eq(usuarios.id, usuarioId));
  return { clave, usuario: u.usuario };
}

export async function eliminarCuentaBarberia(usuarioId: number) {
  await exigirNoir();
  const db = await getDb();
  const [u] = await db
    .delete(usuarios)
    .where(and(eq(usuarios.id, usuarioId), not(eq(usuarios.rol, "noir"))))
    .returning({ barberiaId: usuarios.barberiaId });
  if (u?.barberiaId) revalidatePath(`/noir/barberias/${u.barberiaId}`);
}

// Borra la barbería con todos sus datos (citas, clientes, barberos, cuentas y fotos).
// Los pagos quedan en el historial sin barbería asociada.
export async function eliminarBarberia(id: number, _: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  await exigirNoir();
  const db = await getDb();
  const [b] = await db.select().from(barberias).where(eq(barberias.id, id));
  if (!b) return { error: "La barbería ya no existe." };
  if (texto(form, "confirmar").toLowerCase() !== b.nombre.trim().toLowerCase()) {
    return { error: `Escribe exactamente "${b.nombre}" para confirmar.` };
  }
  await db.transaction(async (tx) => {
    await tx.delete(citas).where(eq(citas.barberiaId, id));
    await tx.delete(bloqueos).where(eq(bloqueos.barberiaId, id));
    await tx.delete(barberias).where(eq(barberias.id, id));
  });
  // Fotos subidas por la barbería
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const fotos = await list({ prefix: `barberias/${id}/` });
      if (fotos.blobs.length) await del(fotos.blobs.map((f) => f.url));
    } catch (e) {
      console.error("No se pudieron borrar las fotos de la barbería", id, e);
    }
  }
  revalidatePath("/noir", "layout");
  revalidatePath(`/${b.slug}`, "layout");
  redirect("/noir/barberias");
}
