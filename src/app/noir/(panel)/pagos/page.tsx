import { CaretLeftIcon, CaretRightIcon, TrashIcon } from "@phosphor-icons/react/ssr";
import { and, asc, desc, eq, gte, lt } from "drizzle-orm";
import Link from "next/link";
import { planes } from "@/config/planes";
import { region } from "@/config/region";
import { getDb } from "@/db";
import { barberias, pagos, usuarios } from "@/db/schema";
import { fechaCorta, fmtUsd } from "@/lib/noir";
import { exigirNoir } from "@/lib/sesion";
import { ahoraLocal } from "@/lib/tiempo";
import { eliminarPago } from "../../acciones";
import { FormularioPago } from "./FormularioPago";

export const dynamic = "force-dynamic";

function mesVecino(mes: string, n: number) {
  const [a, m] = mes.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1 + n, 1)).toISOString().slice(0, 7);
}

export default async function PagosNoir({ searchParams }: PageProps<"/noir/pagos">) {
  await exigirNoir();
  const params = await searchParams;
  const mesActual = ahoraLocal().fecha.slice(0, 7);
  const mes = typeof params.mes === "string" && /^\d{4}-\d{2}$/.test(params.mes) ? params.mes : mesActual;
  // Rango del mes en hora de Colombia (UTC-5)
  const desde = new Date(`${mes}-01T05:00:00Z`);
  const hasta = new Date(`${mesVecino(mes, 1)}-01T05:00:00Z`);

  const db = await getDb();
  const [lista, opciones] = await Promise.all([
    db
      .select({ p: pagos, barberia: barberias.nombre, barberiaId: barberias.id, quien: usuarios.nombre })
      .from(pagos)
      .leftJoin(barberias, eq(pagos.barberiaId, barberias.id))
      .leftJoin(usuarios, eq(pagos.registradoPor, usuarios.id))
      .where(and(gte(pagos.fecha, desde), lt(pagos.fecha, hasta)))
      .orderBy(desc(pagos.fecha)),
    db.select({ id: barberias.id, nombre: barberias.nombre, plan: barberias.plan }).from(barberias).orderBy(asc(barberias.nombre)),
  ]);

  const total = lista.reduce((s, x) => s + x.p.montoCentavos, 0);
  const porMetodo = Object.entries(
    lista.reduce<Record<string, number>>((m, x) => ({ ...m, [x.p.metodo]: (m[x.p.metodo] ?? 0) + x.p.montoCentavos }), {}),
  ).sort((a, b) => b[1] - a[1]);
  const titulo = new Intl.DateTimeFormat(region.locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${mes}-15T00:00:00Z`));

  return (
    <div className="space-y-10">
      <section>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold first-letter:uppercase">Pagos de {titulo}</h1>
          <div className="flex gap-2">
            <Link href={`/noir/pagos?mes=${mesVecino(mes, -1)}`} aria-label="Mes anterior" className="grid size-10 place-items-center rounded-full border border-linea hover:bg-white/5">
              <CaretLeftIcon size={16} />
            </Link>
            {mes < mesActual && (
              <Link href={`/noir/pagos?mes=${mesVecino(mes, 1)}`} aria-label="Mes siguiente" className="grid size-10 place-items-center rounded-full border border-linea hover:bg-white/5">
                <CaretRightIcon size={16} />
              </Link>
            )}
          </div>
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl bg-superficie p-5">
            <dt className="text-xs text-tenue">Total del mes</dt>
            <dd className="display mt-1 text-2xl font-semibold tabular-nums">{fmtUsd(total)}</dd>
          </div>
          <div className="rounded-2xl bg-superficie p-5">
            <dt className="text-xs text-tenue">Pagos</dt>
            <dd className="display mt-1 text-2xl font-semibold tabular-nums">{lista.length}</dd>
          </div>
          <div className="col-span-2 rounded-2xl bg-superficie p-5">
            <dt className="text-xs text-tenue">Por medio de pago</dt>
            <dd className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
              {porMetodo.length === 0 ? <span className="text-tenue">-</span> : porMetodo.map(([m, c]) => <span key={m}>{m}: <strong className="tabular-nums">{fmtUsd(c)}</strong></span>)}
            </dd>
          </div>
        </dl>

        {lista.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-linea px-6 py-10 text-center text-sm text-tenue">No hay pagos registrados en este mes.</p>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-2xl border border-linea">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="text-left text-tenue">
                <tr>
                  <th className="px-4 py-3 font-normal">Fecha</th>
                  <th className="px-4 py-3 font-normal">Quién pagó</th>
                  <th className="px-4 py-3 font-normal">Barbería</th>
                  <th className="px-4 py-3 font-normal">Plan</th>
                  <th className="px-4 py-3 font-normal">Medio</th>
                  <th className="px-4 py-3 text-right font-normal">Monto</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {lista.map(({ p, barberia, barberiaId, quien }) => (
                  <tr key={p.id} className="border-t border-linea">
                    <td className="px-4 py-3 tabular-nums text-tenue">{fechaCorta(p.fecha)}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold">{p.cliente || "-"}</span>
                      {p.referencia && <span className="block text-xs text-tenue">Ref. {p.referencia}</span>}
                    </td>
                    <td className="px-4 py-3">
                      {barberia ? (
                        <Link href={`/noir/barberias/${barberiaId}`} className="hover:underline">
                          {barberia}
                        </Link>
                      ) : (
                        <span className="text-tenue">Código sin usar</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{planes[p.plan].nombre}</td>
                    <td className="px-4 py-3 text-tenue">
                      {p.metodo}
                      {quien && <span className="block text-xs">registró {quien}</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{fmtUsd(p.montoCentavos)}</td>
                    <td className="px-2 py-3">
                      <form action={eliminarPago.bind(null, p.id)}>
                        <button type="submit" aria-label="Eliminar pago" className="grid size-8 place-items-center rounded-full text-tenue transition hover:bg-peligro/15 hover:text-peligro">
                          <TrashIcon size={16} />
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold">Registrar un pago</h2>
        <p className="mt-1 text-sm text-tenue">Para renovaciones de barberías que ya existen. Los pagos de clientes nuevos se registran al generar su código.</p>
        {opciones.length === 0 ? (
          <p className="mt-4 text-sm text-tenue">Aún no hay barberías.</p>
        ) : (
          <FormularioPago barberias={opciones} />
        )}
      </section>
    </div>
  );
}
