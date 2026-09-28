import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { barberos, servicios } from "@/db/schema";

export async function serviciosActivos() {
  const db = await getDb();
  return db.select().from(servicios).where(eq(servicios.activo, true)).orderBy(asc(servicios.orden), asc(servicios.id));
}

export async function barberosActivos() {
  const db = await getDb();
  return db.select().from(barberos).where(eq(barberos.activo, true)).orderBy(asc(barberos.orden), asc(barberos.id));
}
