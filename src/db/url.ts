// Cadena de conexión a Postgres. Prioridad: Supabase (integración de Vercel con prefijo
// SUPABASE_) y después DATABASE_URL (Neon u otro Postgres). Sin ninguna, en local se usa PGlite.
//
// conexionDirecta: para migraciones conviene la conexión sin pooler de Supabase.
export function urlBaseDatos({ conexionDirecta = false } = {}): string | undefined {
  const supabase = conexionDirecta
    ? (process.env.SUPABASE_POSTGRES_URL_NON_POOLING ?? process.env.SUPABASE_POSTGRES_URL)
    : process.env.SUPABASE_POSTGRES_URL;
  return supabase || process.env.DATABASE_URL || undefined;
}
