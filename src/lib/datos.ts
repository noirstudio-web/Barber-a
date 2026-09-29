import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { barberos, galeria, resenas, servicios } from "@/db/schema";

export async function serviciosActivos(barberiaId: number) {
  const db = await getDb();
  return db
    .select()
    .from(servicios)
    .where(and(eq(servicios.barberiaId, barberiaId), eq(servicios.activo, true)))
    .orderBy(asc(servicios.orden), asc(servicios.id));
}

export async function barberosActivos(barberiaId: number) {
  const db = await getDb();
  return db
    .select()
    .from(barberos)
    .where(and(eq(barberos.barberiaId, barberiaId), eq(barberos.activo, true)))
    .orderBy(asc(barberos.orden), asc(barberos.id));
}

export async function galeriaDe(barberiaId: number) {
  const db = await getDb();
  return db.select().from(galeria).where(eq(galeria.barberiaId, barberiaId)).orderBy(asc(galeria.orden), asc(galeria.id));
}

export async function resenasDe(barberiaId: number) {
  const db = await getDb();
  return db.select().from(resenas).where(eq(resenas.barberiaId, barberiaId)).orderBy(asc(resenas.orden), asc(resenas.id));
}
