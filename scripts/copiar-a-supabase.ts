// Copia todos los datos de la base actual (Neon) a Supabase, sin borrar nada del origen.
// Uso: ORIGEN_URL=... DESTINO_URL=... npx tsx scripts/copiar-a-supabase.ts
//   ORIGEN_URL   conexión a Neon (DATABASE_URL de hoy)
//   DESTINO_URL  conexión directa a Supabase (SUPABASE_POSTGRES_URL_NON_POOLING)
//
// 1. Crea las tablas en Supabase con las migraciones.
// 2. Vacía las tablas del destino y copia cada tabla conservando los ids.
// 3. Ajusta los contadores de ids y compara cuántas filas quedaron en cada tabla.
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

// Orden que respeta las llaves foráneas
const TABLAS = ["barberias", "barberos", "servicios", "clientes", "citas", "bloqueos", "galeria", "resenas", "usuarios", "codigos", "pagos", "compras"];

async function main() {
  const origenUrl = process.env.ORIGEN_URL;
  const destinoUrl = process.env.DESTINO_URL;
  if (!origenUrl || !destinoUrl) throw new Error("Define ORIGEN_URL y DESTINO_URL");
  if (origenUrl === destinoUrl) throw new Error("El origen y el destino son la misma base de datos");

  const origen = postgres(origenUrl, { prepare: false, max: 1 });
  const destino = postgres(destinoUrl, { prepare: false, max: 1 });

  await migrate(drizzle(destino), { migrationsFolder: "drizzle" });
  console.log("Tablas creadas en Supabase.");

  // Asegura que el origen tenga todas las columnas nuevas antes de copiar
  await migrate(drizzle(origen), { migrationsFolder: "drizzle" });

  await destino.begin(async (tx) => {
    await tx.unsafe(`truncate ${TABLAS.map((t) => `"${t}"`).join(", ")} restart identity cascade`);
    for (const tabla of TABLAS) {
      const filas = await origen.unsafe(`select * from "${tabla}"`);
      for (let i = 0; i < filas.length; i += 500) {
        const lote = filas.slice(i, i + 500);
        await tx`insert into ${tx(tabla)} ${tx(lote as unknown as Record<string, unknown>[])}`;
      }
      if (tabla !== "compras") {
        await tx.unsafe(`select setval(pg_get_serial_sequence('"${tabla}"', 'id'), coalesce((select max(id) from "${tabla}"), 0) + 1, false)`);
      }
      console.log(`${tabla}: ${filas.length} filas copiadas`);
    }
  });

  let ok = true;
  for (const tabla of TABLAS) {
    const [{ a }] = await origen.unsafe(`select count(*)::int as a from "${tabla}"`);
    const [{ b }] = await destino.unsafe(`select count(*)::int as b from "${tabla}"`);
    if (a !== b) {
      ok = false;
      console.error(`DIFERENCIA en ${tabla}: origen ${a}, Supabase ${b}`);
    }
  }
  console.log(ok ? "Copia verificada: todas las tablas tienen las mismas filas." : "La copia tiene diferencias, revisa arriba.");
  await origen.end();
  await destino.end();
  if (!ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
