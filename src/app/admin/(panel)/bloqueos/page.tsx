import { TrashIcon } from "@phosphor-icons/react/ssr";
import { and, asc, eq, gte } from "drizzle-orm";
import { getDb } from "@/db";
import { barberos, bloqueos } from "@/db/schema";
import { exigirPanel } from "@/lib/sesion";
import { ahoraLocal, fmtFecha, fmtHora } from "@/lib/tiempo";
import { eliminarBloqueo } from "../../acciones";
import { FormularioBloqueo } from "./FormularioBloqueo";

export const dynamic = "force-dynamic";

export default async function PaginaBloqueos() {
  const { barberia } = await exigirPanel();
  const db = await getDb();
  const hoy = ahoraLocal().fecha;
  const [equipo, lista] = await Promise.all([
    db.select({ id: barberos.id, nombre: barberos.nombre }).from(barberos).where(and(eq(barberos.barberiaId, barberia.id), eq(barberos.activo, true))).orderBy(asc(barberos.orden)),
    db.select().from(bloqueos).where(and(eq(bloqueos.barberiaId, barberia.id), gte(bloqueos.hasta, hoy))).orderBy(asc(bloqueos.desde), asc(bloqueos.inicioMin)),
  ]);
  const nombre = (id: number | null) => (id === null ? "Toda la barbería" : (equipo.find((b) => b.id === id)?.nombre ?? "Barbero inactivo"));
  const corta = (f: string) => fmtFecha(f, { weekday: "short", day: "numeric", month: "short" });

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <section className="lg:col-span-5">
        <h1 className="text-2xl font-semibold">Bloquear horario</h1>
        <p className="mt-1 text-sm text-tenue">Almuerzos, días libres o vacaciones. Esas horas dejan de aparecer para reservar.</p>
        <FormularioBloqueo equipo={equipo} hoy={hoy} />
      </section>

      <section className="lg:col-span-7">
        <h2 className="text-lg font-semibold">Próximos bloqueos</h2>
        {lista.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-linea px-6 py-10 text-center text-sm text-tenue">
            No hay bloqueos. Todo el horario está disponible para reservas.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {lista.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-4 rounded-xl bg-superficie px-4 py-3">
                <div className="text-sm">
                  <p className="font-semibold">
                    {nombre(b.barberoId)}
                    {b.motivo && <span className="font-normal text-tenue">: {b.motivo}</span>}
                  </p>
                  <p className="mt-0.5 capitalize text-tenue">
                    {b.desde === b.hasta ? corta(b.desde) : `${corta(b.desde)} al ${corta(b.hasta)}`}
                    <span className="normal-case">
                      {b.inicioMin === null ? ", todo el día" : `, ${fmtHora(b.inicioMin)} a ${fmtHora(b.finMin!)}`}
                    </span>
                  </p>
                </div>
                <form action={eliminarBloqueo.bind(null, b.id)}>
                  <button type="submit" aria-label="Eliminar bloqueo" className="grid size-9 place-items-center rounded-full text-tenue transition hover:bg-peligro/15 hover:text-peligro">
                    <TrashIcon size={18} />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
