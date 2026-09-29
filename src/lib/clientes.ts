import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { citas, clientes } from "@/db/schema";
import { ahoraLocal, sumarDias } from "./tiempo";

// Días sin venir para considerar a un cliente "por recuperar"
export const DIAS_SIN_VENIR = 30;

// Clientes de una barbería con su resumen de visitas.
// recuperar: solo los que no vienen hace más de DIAS_SIN_VENIR días y no tienen cita próxima.
export async function listarClientes(barberiaId: number, opciones: { busqueda?: string; recuperar?: boolean; limite?: number } = {}) {
  const hoy = ahoraLocal().fecha;
  const db = await getDb();
  const ultima = sql<string | null>`max(${citas.fecha}) filter (where ${citas.estado} = 'completada')`;
  const proxima = sql<string | null>`min(${citas.fecha}) filter (where ${citas.estado} = 'confirmada' and ${citas.fecha} >= ${hoy})`;
  const b = opciones.busqueda?.trim();

  return db
    .select({
      id: clientes.id,
      nombre: clientes.nombre,
      telefono: clientes.telefono,
      visitas: sql<number>`count(*) filter (where ${citas.estado} = 'completada')::int`,
      gastado: sql<number>`coalesce(sum(${citas.precio}) filter (where ${citas.estado} = 'completada'), 0)::int`,
      ultima,
      proxima,
      faltas: sql<number>`count(*) filter (where ${citas.estado} = 'no_asistio')::int`,
    })
    .from(clientes)
    .leftJoin(citas, eq(citas.clienteId, clientes.id))
    .where(
      and(
        eq(clientes.barberiaId, barberiaId),
        b ? or(ilike(clientes.nombre, `%${b}%`), ilike(clientes.telefono, `%${b.replace(/\D/g, "") || b}%`)) : undefined,
      ),
    )
    .groupBy(clientes.id)
    .having(opciones.recuperar ? sql`${ultima} < ${sumarDias(hoy, -DIAS_SIN_VENIR)} and ${proxima} is null` : undefined)
    .orderBy(opciones.recuperar ? desc(sql`count(*) filter (where ${citas.estado} = 'completada')`) : sql`max(${citas.fecha}) desc nulls last`, desc(clientes.creadoEn))
    .limit(opciones.limite ?? 200);
}
