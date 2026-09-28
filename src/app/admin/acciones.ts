"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db";
import { bloqueos, citas, ESTADOS_CITA, servicios } from "@/db/schema";
import { borrarSesion, exigirAdmin, guardarSesion } from "@/lib/sesion";
import { esFechaValida, horaAMinutos } from "@/lib/tiempo";
import { claveCorrecta } from "@/lib/token";

export type EstadoFormulario = { error?: string; ok?: string };

export async function iniciarSesion(_: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const clave = String(form.get("clave") ?? "");
  if (!(await claveCorrecta(clave))) return { error: "Clave incorrecta." };
  await guardarSesion();
  redirect("/admin");
}

export async function cerrarSesion() {
  await borrarSesion();
  redirect("/admin/login");
}

export async function cambiarEstadoCita(id: number, estado: (typeof ESTADOS_CITA)[number]) {
  await exigirAdmin();
  if (!ESTADOS_CITA.includes(estado)) return;
  const db = await getDb();
  await db.update(citas).set({ estado }).where(eq(citas.id, id));
  revalidatePath("/admin", "layout");
}

const esquemaBloqueo = z
  .object({
    barberoId: z.string().transform((v) => (v ? Number(v) : null)),
    desde: z.string().refine(esFechaValida, "Fecha de inicio inválida"),
    hasta: z.string().refine(esFechaValida, "Fecha final inválida"),
    diaCompleto: z.boolean(),
    horaInicio: z.string(),
    horaFin: z.string(),
    motivo: z.string().trim().max(80),
  })
  .refine((b) => b.hasta >= b.desde, { message: "La fecha final debe ser igual o posterior a la inicial" });

export async function crearBloqueo(_: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  await exigirAdmin();
  const hasta = String(form.get("hasta") || form.get("desde") || "");
  const parsed = esquemaBloqueo.safeParse({
    barberoId: String(form.get("barberoId") ?? ""),
    desde: String(form.get("desde") ?? ""),
    hasta,
    diaCompleto: form.get("diaCompleto") === "on",
    horaInicio: String(form.get("horaInicio") ?? ""),
    horaFin: String(form.get("horaFin") ?? ""),
    motivo: String(form.get("motivo") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos" };
  const b = parsed.data;

  let inicioMin: number | null = null;
  let finMin: number | null = null;
  if (!b.diaCompleto) {
    inicioMin = horaAMinutos(b.horaInicio);
    finMin = horaAMinutos(b.horaFin);
    if (inicioMin === null || finMin === null || finMin <= inicioMin) {
      return { error: "Indica una hora de inicio y una hora final posterior." };
    }
  }

  const db = await getDb();
  await db.insert(bloqueos).values({ barberoId: b.barberoId, desde: b.desde, hasta: b.hasta, inicioMin, finMin, motivo: b.motivo });
  revalidatePath("/admin", "layout");
  return { ok: "Horario bloqueado." };
}

export async function eliminarBloqueo(id: number) {
  await exigirAdmin();
  const db = await getDb();
  await db.delete(bloqueos).where(eq(bloqueos.id, id));
  revalidatePath("/admin", "layout");
}

const esquemaServicio = z.object({
  id: z.string().transform((v) => (v ? Number(v) : null)),
  nombre: z.string().trim().min(2, "El nombre es muy corto").max(60),
  descripcion: z.string().trim().max(160),
  duracionMin: z.coerce.number().int().min(5, "Duración mínima: 5 minutos").max(480),
  precio: z.coerce.number().int().min(0, "El precio no puede ser negativo"),
});

export async function guardarServicio(_: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  await exigirAdmin();
  const parsed = esquemaServicio.safeParse({
    id: String(form.get("id") ?? ""),
    nombre: form.get("nombre"),
    descripcion: String(form.get("descripcion") ?? ""),
    duracionMin: form.get("duracionMin"),
    precio: String(form.get("precio") ?? "").replace(/[^\d]/g, ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos" };
  const { id, ...datos } = parsed.data;

  const db = await getDb();
  if (id) {
    await db.update(servicios).set(datos).where(eq(servicios.id, id));
  } else {
    // Los servicios nuevos van al final de la lista
    const [{ maximo }] = await db.select({ maximo: sql<number>`coalesce(max(${servicios.orden}), 0)::int` }).from(servicios);
    await db.insert(servicios).values({ ...datos, orden: maximo + 1 });
  }
  revalidatePath("/", "layout");
  return { ok: id ? "Servicio actualizado." : "Servicio creado." };
}

export async function alternarServicio(id: number, activo: boolean) {
  await exigirAdmin();
  const db = await getDb();
  await db.update(servicios).set({ activo }).where(eq(servicios.id, id));
  revalidatePath("/", "layout");
}
