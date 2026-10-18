// Aplica las migraciones y carga los datos iniciales en la base de datos (Supabase o DATABASE_URL).
// Uso: npm run db:migrate            (servicios y barberos de ejemplo + citas demo)
//      npm run db:migrate -- --sin-demo   (sin citas ni clientes de ejemplo)
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "../src/db/schema";
import { sembrar } from "../src/db/seed";
import { urlBaseDatos } from "../src/db/url";

async function main() {
  const url = urlBaseDatos({ conexionDirecta: true });
  if (!url) {
    // En Vercel la base de datos llega con la integración de Supabase
    if (process.env.VERCEL) throw new Error("Falta la base de datos en las variables de entorno de Vercel.");
    throw new Error("Define DATABASE_URL o SUPABASE_POSTGRES_URL en .env");
  }
  const cliente = postgres(url, { prepare: false, max: 1 });
  const db = drizzle(cliente, { schema });
  await migrate(db, { migrationsFolder: "drizzle" });
  console.log("Migraciones aplicadas.");
  const sembrado = await sembrar(db, { conCitasDemo: !process.argv.includes("--sin-demo") });
  console.log(sembrado ? "Datos iniciales cargados." : "La base ya tenía datos; no se sembró nada.");
  await cliente.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
