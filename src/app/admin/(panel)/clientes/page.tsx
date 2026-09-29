import { MagnifyingGlassIcon } from "@phosphor-icons/react/ssr";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import Link from "next/link";
import { getDb } from "@/db";
import { citas, clientes } from "@/db/schema";
import { exigirPanel } from "@/lib/sesion";
import { ahoraLocal, fmtFecha, fmtPrecio } from "@/lib/tiempo";

export const dynamic = "force-dynamic";

export default async function PaginaClientes({ searchParams }: PageProps<"/admin/clientes">) {
  const { q } = await searchParams;
  const busqueda = typeof q === "string" ? q.trim() : "";
  const hoy = ahoraLocal().fecha;
  const { barberia } = await exigirPanel();
  const db = await getDb();

  const lista = await db
    .select({
      id: clientes.id,
      nombre: clientes.nombre,
      telefono: clientes.telefono,
      visitas: sql<number>`count(*) filter (where ${citas.estado} = 'completada')::int`,
      gastado: sql<number>`coalesce(sum(${citas.precio}) filter (where ${citas.estado} = 'completada'), 0)::int`,
      ultima: sql<string | null>`max(${citas.fecha}) filter (where ${citas.estado} = 'completada')`,
      proxima: sql<string | null>`min(${citas.fecha}) filter (where ${citas.estado} = 'confirmada' and ${citas.fecha} >= ${hoy})`,
      faltas: sql<number>`count(*) filter (where ${citas.estado} = 'no_asistio')::int`,
    })
    .from(clientes)
    .leftJoin(citas, eq(citas.clienteId, clientes.id))
    .where(
      and(
        eq(clientes.barberiaId, barberia.id),
        busqueda ? or(ilike(clientes.nombre, `%${busqueda}%`), ilike(clientes.telefono, `%${busqueda.replace(/\D/g, "") || busqueda}%`)) : undefined,
      ),
    )
    .groupBy(clientes.id)
    .orderBy(sql`max(${citas.fecha}) desc nulls last`, desc(clientes.creadoEn))
    .limit(200);

  const corta = (f: string | null) => (f ? fmtFecha(f, { day: "numeric", month: "short" }) : "-");

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Clientes</h1>
          <p className="mt-1 text-sm text-tenue">Se agregan solos cuando alguien reserva.</p>
        </div>
        <form className="relative w-full sm:w-72">
          <MagnifyingGlassIcon size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-tenue" />
          <input
            name="q"
            defaultValue={busqueda}
            placeholder="Buscar por nombre o celular"
            aria-label="Buscar clientes"
            className="w-full rounded-full border border-linea bg-superficie py-2.5 pl-10 pr-4 text-sm outline-none focus:border-cromo"
          />
        </form>
      </div>

      {lista.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-linea px-6 py-12 text-center text-sm text-tenue">
          {busqueda ? `Nadie coincide con “${busqueda}”.` : "Todavía no hay clientes. Aparecerán con la primera reserva."}
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-linea">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-tenue">
              <tr>
                <th className="px-4 py-3 font-normal">Cliente</th>
                <th className="px-4 py-3 font-normal">Celular</th>
                <th className="px-4 py-3 text-right font-normal">Visitas</th>
                <th className="px-4 py-3 font-normal">Última visita</th>
                <th className="px-4 py-3 font-normal">Próxima cita</th>
                <th className="px-4 py-3 text-right font-normal">Total</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((c) => (
                <tr key={c.id} className="border-t border-linea transition hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <Link href={`/admin/clientes/${c.id}`} className="font-semibold hover:underline">
                      {c.nombre}
                    </Link>
                    {c.faltas > 0 && <span className="ml-2 text-xs text-peligro">{c.faltas} {c.faltas === 1 ? "falta" : "faltas"}</span>}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-tenue">{c.telefono}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{c.visitas}</td>
                  <td className="px-4 py-3 text-tenue">{corta(c.ultima)}</td>
                  <td className="px-4 py-3">{corta(c.proxima)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtPrecio(c.gastado)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
