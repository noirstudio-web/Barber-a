import { TrashIcon } from "@phosphor-icons/react/ssr";
import { desc, eq } from "drizzle-orm";
import { planes } from "@/config/planes";
import { getDb } from "@/db";
import { barberias, codigos } from "@/db/schema";
import { exigirNoir } from "@/lib/sesion";
import { eliminarCodigo } from "../../acciones";
import { EnviarCodigo } from "./EnviarCodigo";
import { GenerarCodigo } from "./GenerarCodigo";

export const dynamic = "force-dynamic";

const fecha = (d: Date) => new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", timeZone: "America/Bogota" }).format(d);

export default async function PaginaCodigos() {
  await exigirNoir();
  const db = await getDb();
  const lista = await db
    .select({ c: codigos, barberia: barberias.nombre })
    .from(codigos)
    .leftJoin(barberias, eq(codigos.barberiaId, barberias.id))
    .orderBy(desc(codigos.creadoEn))
    .limit(100);

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <section className="lg:col-span-5">
        <h1 className="text-2xl font-semibold">Generar código</h1>
        <p className="mt-1 text-sm text-tenue">
          Cuando un cliente te compre, genera su código y envíaselo por WhatsApp. Sirve para activar una barbería nueva o para renovar una existente.
        </p>
        <GenerarCodigo />
      </section>

      <section className="lg:col-span-7">
        <h2 className="text-lg font-semibold">Códigos recientes</h2>
        {lista.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-linea px-6 py-10 text-center text-sm text-tenue">Aún no has generado códigos.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {lista.map(({ c, barberia }) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-superficie px-4 py-3 text-sm">
                <div>
                  <p className="font-mono tracking-widest">{c.codigo}</p>
                  <p className="mt-0.5 text-tenue">
                    {planes[c.plan].nombre}, {c.dias} días{c.nota && `, ${c.nota}`}
                  </p>
                </div>
                {c.usadoEn ? (
                  <p className="text-right text-xs text-tenue">
                    Usado el {fecha(c.usadoEn)}
                    {barberia && (
                      <>
                        <br />
                        por {barberia}
                      </>
                    )}
                  </p>
                ) : (
                  <div className="flex items-center gap-1">
                    <EnviarCodigo codigo={c.codigo} plan={c.plan} dias={c.dias} />
                    <form action={eliminarCodigo.bind(null, c.id)}>
                      <button type="submit" aria-label="Eliminar código" className="grid size-8 place-items-center rounded-full text-tenue transition hover:bg-peligro/15 hover:text-peligro">
                        <TrashIcon size={16} />
                      </button>
                    </form>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
