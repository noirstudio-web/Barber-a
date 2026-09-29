import { eq } from "drizzle-orm";
import { cache } from "react";
import { SLUGS_RESERVADOS } from "@/config/noir";
import { planes } from "@/config/planes";
import { getDb } from "@/db";
import { barberias, type Barberia } from "@/db/schema";

// Una sola consulta por petición aunque varias partes de la página la pidan
export const barberiaPorSlug = cache(async (slug: string): Promise<Barberia | null> => {
  const db = await getDb();
  const [b] = await db.select().from(barberias).where(eq(barberias.slug, slug.toLowerCase()));
  return b ?? null;
});

export const barberiaPorId = cache(async (id: number): Promise<Barberia | null> => {
  const db = await getDb();
  const [b] = await db.select().from(barberias).where(eq(barberias.id, id));
  return b ?? null;
});

export type EstadoSuscripcion = {
  activa: boolean;
  motivo: "activa" | "vencida" | "suspendida";
  diasRestantes: number;
};

export function estadoSuscripcion(b: Pick<Barberia, "venceEn" | "suspendida">): EstadoSuscripcion {
  const diasRestantes = Math.ceil((b.venceEn.getTime() - Date.now()) / 86_400_000);
  if (b.suspendida) return { activa: false, motivo: "suspendida", diasRestantes };
  if (diasRestantes <= 0) return { activa: false, motivo: "vencida", diasRestantes };
  return { activa: true, motivo: "activa", diasRestantes };
}

export function limitesPlan(b: Pick<Barberia, "plan">) {
  return planes[b.plan] ?? planes.basico;
}

// "Barbería Don Pepe" -> "barberia-don-pepe"
export function slugDesde(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function slugValido(slug: string): string | null {
  if (!/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/.test(slug)) {
    return "La dirección debe tener de 3 a 40 letras minúsculas, números o guiones.";
  }
  if (SLUGS_RESERVADOS.has(slug)) return "Esa dirección está reservada. Elige otra.";
  return null;
}

// Suma días a partir de hoy o del vencimiento actual, lo que sea más tarde
export function nuevoVencimiento(actual: Date | null, dias: number): Date {
  const base = actual && actual.getTime() > Date.now() ? actual.getTime() : Date.now();
  return new Date(base + dias * 86_400_000);
}
