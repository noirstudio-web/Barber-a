"use server";

import { and, count, eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db";
import { barberos, bloqueos, citas, ESTADOS_CITA, servicios, usuarios } from "@/db/schema";
import { borrarSesion, exigirAdmin, exigirDueno, guardarSesion, hashClave, verificarClave } from "@/lib/sesion";
import { esFechaValida, horaAMinutos } from "@/lib/tiempo";
import { codigoCorrecto } from "@/lib/token";

// valores: lo que escribió la persona, para no borrarlo si hay un error
export type EstadoFormulario = { error?: string; ok?: string; valores?: Record<string, string> };

// Hash fijo para comparar aunque el usuario no exista y no revelar cuáles existen por el tiempo de respuesta
let hashFicticio: Promise<string> | null = null;

export async function iniciarSesion(_: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const usuario = String(form.get("usuario") ?? "").trim().toLowerCase();
  const clave = String(form.get("clave") ?? "");
  const db = await getDb();
  const [u] = await db.select().from(usuarios).where(eq(usuarios.usuario, usuario));
  hashFicticio ??= hashClave("clave-inexistente");
  const valida = await verificarClave(clave, u?.claveHash ?? (await hashFicticio));
  if (!u || !valida) return { error: "Usuario o contraseña incorrectos.", valores: { usuario } };
  await guardarSesion(u.id);
  redirect("/admin");
}

const esquemaUsuario = z.object({
  nombre: z.string().trim().min(2, "Escribe tu nombre").max(60),
  usuario: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9._-]{3,30}$/, "El usuario debe tener de 3 a 30 letras, números, punto, guion o guion bajo, sin espacios"),
  clave: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(100),
});

export async function registrarse(_: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const valores = { nombre: String(form.get("nombre") ?? ""), usuario: String(form.get("usuario") ?? "") };
  if (!(await codigoCorrecto(String(form.get("codigo") ?? "")))) return { error: "El código del negocio no es correcto.", valores };
  const parsed = esquemaUsuario.safeParse({ nombre: form.get("nombre"), usuario: form.get("usuario"), clave: form.get("clave") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos", valores };
  if (form.get("clave") !== form.get("clave2")) return { error: "Las contraseñas no coinciden.", valores };

  const db = await getDb();
  const [{ total }] = await db.select({ total: count() }).from(usuarios);
  const creado = await db
    .insert(usuarios)
    .values({
      nombre: parsed.data.nombre,
      usuario: parsed.data.usuario,
      claveHash: await hashClave(parsed.data.clave),
      // El primer usuario administra a los demás
      rol: total === 0 ? "dueno" : "equipo",
    })
    .onConflictDoNothing()
    .returning({ id: usuarios.id });
  if (creado.length === 0) return { error: "Ese usuario ya existe. Elige otro.", valores };
  await guardarSesion(creado[0].id);
  redirect("/admin");
}

export async function cambiarClave(_: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const yo = await exigirAdmin();
  if (!(await verificarClave(String(form.get("actual") ?? ""), yo.claveHash))) return { error: "La contraseña actual no es correcta." };
  const nueva = String(form.get("nueva") ?? "");
  if (nueva.length < 8) return { error: "La nueva contraseña debe tener al menos 8 caracteres." };
  if (nueva !== form.get("nueva2")) return { error: "Las contraseñas nuevas no coinciden." };
  const db = await getDb();
  await db.update(usuarios).set({ claveHash: await hashClave(nueva) }).where(eq(usuarios.id, yo.id));
  return { ok: "Contraseña actualizada." };
}

export async function eliminarUsuario(id: number) {
  const yo = await exigirDueno();
  if (id === yo.id) return;
  const db = await getDb();
  await db.delete(usuarios).where(and(eq(usuarios.id, id), ne(usuarios.rol, "dueno")));
  revalidatePath("/admin/cuenta");
}

export async function hacerDueno(id: number) {
  await exigirDueno();
  const db = await getDb();
  await db.update(usuarios).set({ rol: "dueno" }).where(eq(usuarios.id, id));
  revalidatePath("/admin/cuenta");
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

const esquemaBarbero = z.object({
  id: z.coerce.number().int().positive(),
  nombre: z.string().trim().min(2, "El nombre es muy corto").max(60),
  especialidad: z.string().trim().min(2, "Escribe la especialidad").max(80),
  telefono: z
    .string()
    .transform((t) => t.replace(/[^\d]/g, ""))
    .refine((t) => t === "" || (t.length >= 7 && t.length <= 15), "Escribe un celular válido o déjalo vacío"),
});

export async function guardarBarbero(_: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  await exigirAdmin();
  const parsed = esquemaBarbero.safeParse({
    id: form.get("id"),
    nombre: form.get("nombre"),
    especialidad: form.get("especialidad"),
    telefono: String(form.get("telefono") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos" };
  const { id, telefono, ...datos } = parsed.data;
  const db = await getDb();
  await db
    .update(barberos)
    .set({ ...datos, telefono: telefono || null })
    .where(eq(barberos.id, id));
  revalidatePath("/", "layout");
  return { ok: "Guardado." };
}

export async function alternarBarbero(id: number, activo: boolean) {
  await exigirAdmin();
  const db = await getDb();
  await db.update(barberos).set({ activo }).where(eq(barberos.id, id));
  revalidatePath("/", "layout");
}
