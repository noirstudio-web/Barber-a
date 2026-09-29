"use server";

import { randomInt } from "node:crypto";
import { and, eq, isNull, not } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { PLANES, planes, type Plan } from "@/config/planes";
import { getDb } from "@/db";
import { barberias, codigos, usuarios } from "@/db/schema";
import { nuevoVencimiento } from "@/lib/barberias";
import { exigirNoir, guardarSesion, hashClave } from "@/lib/sesion";
import { codigoMaestroCorrecto } from "@/lib/token";
import type { EstadoFormulario } from "../admin/acciones";

const texto = (form: FormData, campo: string) => String(form.get(campo) ?? "").trim();

// Cuenta del equipo de Noir Studio, protegida con el código maestro (ADMIN_PASSWORD)
export async function registrarNoir(_: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const valores = { nombre: texto(form, "nombre"), usuario: texto(form, "usuario").toLowerCase() };
  if (!(await codigoMaestroCorrecto(texto(form, "maestro")))) return { error: "El código maestro no es correcto.", valores };
  const cuenta = z
    .object({
      nombre: z.string().min(2, "Escribe tu nombre").max(60),
      usuario: z.string().regex(/^[a-z0-9._-]{3,30}$/, "El usuario debe tener de 3 a 30 letras, números, punto o guion, sin espacios"),
      clave: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(100),
    })
    .safeParse({ ...valores, clave: form.get("clave") });
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

// Sin letras que se confunden (O/0, I/1)
function nuevoCodigo() {
  const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bloque = () => Array.from({ length: 4 }, () => letras[randomInt(letras.length)]).join("");
  return `NOIR-${bloque()}-${bloque()}`;
}

export type EstadoCodigo = EstadoFormulario & { codigo?: string; plan?: Plan; dias?: number; nota?: string };

export async function generarCodigo(_: EstadoCodigo, form: FormData): Promise<EstadoCodigo> {
  await exigirNoir();
  const plan = texto(form, "plan") as Plan;
  if (!PLANES.includes(plan)) return { error: "Elige un plan." };
  const dias = Number(form.get("dias")) || planes[plan].dias;
  if (!Number.isInteger(dias) || dias < 1 || dias > 400) return { error: "Los días deben estar entre 1 y 400." };
  const nota = texto(form, "nota").slice(0, 80);

  const db = await getDb();
  // Reintenta en el caso (muy raro) de que el código ya exista
  for (let intento = 0; intento < 5; intento++) {
    const codigo = nuevoCodigo();
    const creado = await db.insert(codigos).values({ codigo, plan, dias, nota }).onConflictDoNothing().returning({ id: codigos.id });
    if (creado.length > 0) {
      revalidatePath("/noir", "layout");
      return { ok: "Código creado.", codigo, plan, dias, nota };
    }
  }
  return { error: "No se pudo crear el código. Inténtalo de nuevo." };
}

export async function eliminarCodigo(id: number) {
  await exigirNoir();
  const db = await getDb();
  await db.delete(codigos).where(and(eq(codigos.id, id), isNull(codigos.usadoEn)));
  revalidatePath("/noir", "layout");
}

export async function extenderBarberia(id: number, dias: number) {
  await exigirNoir();
  const db = await getDb();
  const [b] = await db.select().from(barberias).where(eq(barberias.id, id));
  if (!b) return;
  await db.update(barberias).set({ venceEn: nuevoVencimiento(b.venceEn, dias) }).where(eq(barberias.id, id));
  revalidatePath("/noir", "layout");
  revalidatePath(`/${b.slug}`, "layout");
}

export async function cambiarPlanBarberia(id: number, form: FormData) {
  await exigirNoir();
  const plan = texto(form, "plan") as Plan;
  if (!PLANES.includes(plan)) return;
  const db = await getDb();
  const [b] = await db.update(barberias).set({ plan }).where(eq(barberias.id, id)).returning({ slug: barberias.slug });
  revalidatePath("/noir", "layout");
  if (b) revalidatePath(`/${b.slug}`, "layout");
}

export async function alternarSuspension(id: number) {
  await exigirNoir();
  const db = await getDb();
  const [b] = await db
    .update(barberias)
    .set({ suspendida: not(barberias.suspendida) })
    .where(eq(barberias.id, id))
    .returning({ slug: barberias.slug });
  revalidatePath("/noir", "layout");
  if (b) revalidatePath(`/${b.slug}`, "layout");
}
