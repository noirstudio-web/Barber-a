import { mkdirSync } from "node:fs";
import path from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Db = PostgresJsDatabase<typeof schema>;

// Con DATABASE_URL (Neon, Supabase o cualquier Postgres) se usa esa base de datos.
// Sin DATABASE_URL, en desarrollo se usa PGlite: Postgres embebido que guarda los datos
// en .data/, para que la demo funcione sin configurar nada.

const global = globalThis as unknown as { __db?: Promise<Db> };

async function crear(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (url) {
    // prepare: false para ser compatible con poolers (Neon, Supabase)
    const cliente = postgres(url, { prepare: false, max: 5 });
    return drizzle(cliente, { schema });
  }

  if (process.env.NODE_ENV === "production" && process.env.VERCEL) {
    throw new Error("Falta DATABASE_URL. Configúrala en las variables de entorno de Vercel.");
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle: drizzlePglite } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const { sembrar } = await import("./seed");

  const carpeta = path.join(process.cwd(), ".data", "pglite");
  mkdirSync(carpeta, { recursive: true });
  const cliente = new PGlite(carpeta);
  const db = drizzlePglite(cliente, { schema });
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  // Ambos drivers exponen la misma API de Drizzle para Postgres
  const compatible = db as unknown as Db;
  await sembrar(compatible);
  return compatible;
}

export function getDb(): Promise<Db> {
  if (!global.__db) {
    global.__db = crear().catch((e) => {
      global.__db = undefined;
      throw e;
    });
  }
  return global.__db;
}

export { schema };
