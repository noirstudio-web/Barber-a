import { ArrowSquareOutIcon } from "@phosphor-icons/react/ssr";
import { and, asc, count, desc, eq, gt, sql } from "drizzle-orm";
import Link from "next/link";
import { noir } from "@/config/noir";
import { PLANES, planes } from "@/config/planes";
import { getDb } from "@/db";
import { barberias, citas, usuarios } from "@/db/schema";
import { estadoSuscripcion } from "@/lib/barberias";
import { exigirNoir } from "@/lib/sesion";
import { alternarSuspension, cambiarPlanBarberia, extenderBarberia } from "../acciones";

export const dynamic = "force-dynamic";

const fecha = (d: Date) => new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", year: "numeric", timeZone: "America/Bogota" }).format(d);

export default async function PanelNoir() {
  await exigirNoir();
  const db = await getDb();
  const [lista, duenos, conteos] = await Promise.all([
    db.select().from(barberias).orderBy(desc(barberias.creadoEn)),
    db
      .select({ barberiaId: usuarios.barberiaId, nombre: usuarios.nombre })
      .from(usuarios)
      .where(eq(usuarios.rol, "dueno"))
      .orderBy(asc(usuarios.id)),
    db
      .select({ barberiaId: citas.barberiaId, total: count() })
      .from(citas)
      .where(and(gt(citas.creadoEn, sql`now() - interval '30 days'`)))
      .groupBy(citas.barberiaId),
  ]);

  const conEstado = lista.map((b) => ({
    b,
    dueno: duenos.find((d) => d.barberiaId === b.id)?.nombre ?? null,
    citasMes: conteos.find((c) => c.barberiaId === b.id)?.total ?? 0,
    estado: estadoSuscripcion(b),
    esDemo: b.slug === noir.demo,
  }));
  // La barbería de demostración no cuenta como cliente
  const activas = conEstado.filter((f) => f.estado.activa && !f.esDemo);
  const resumen = [
    { t: "Barberías activas", v: activas.length },
    { t: "En prueba", v: activas.filter((f) => f.b.plan === "prueba").length },
    { t: "Vencidas o suspendidas", v: conEstado.filter((f) => !f.estado.activa && !f.esDemo).length },
    { t: "Ingreso mensual", v: `${activas.reduce((s, f) => s + planes[f.b.plan].precioUsd, 0)} USD` },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-semibold">Barberías</h1>
        <Link href="/noir/codigos" className="rounded-full bg-cromo px-5 py-2.5 text-sm font-semibold text-fondo transition hover:bg-white">
          Generar código
        </Link>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {resumen.map((r) => (
          <div key={r.t} className="rounded-2xl bg-superficie p-5">
            <dt className="text-xs text-tenue">{r.t}</dt>
            <dd className="display mt-1 text-2xl font-semibold tabular-nums">{r.v}</dd>
          </div>
        ))}
      </dl>

      {conEstado.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-linea px-6 py-12 text-center text-sm text-tenue">
          Todavía no hay barberías. Genera un código y envíaselo a tu primer cliente.
        </p>
      ) : (
        <ul className="mt-8 space-y-3">
          {conEstado.map(({ b, dueno, citasMes, estado, esDemo }) => (
            <li key={b.id} className="rounded-2xl border border-linea p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="flex flex-wrap items-center gap-2 font-semibold">
                    {b.nombre}
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        !estado.activa ? "bg-peligro/15 text-peligro" : b.plan === "prueba" ? "bg-white/10 text-texto" : "bg-exito/15 text-exito"
                      }`}
                    >
                      {estado.motivo === "suspendida" ? "Suspendida" : estado.motivo === "vencida" ? "Vencida" : planes[b.plan].nombre}
                    </span>
                    {esDemo && <span className="rounded-full border border-linea px-2 py-0.5 text-xs font-medium text-tenue">Demo</span>}
                  </p>
                  <p className="mt-1 text-sm text-tenue">
                    {dueno ?? "Sin dueño"}
                    {b.whatsapp && (
                      <>
                        {", "}
                        <a href={`https://wa.me/${b.whatsapp}`} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">
                          +{b.whatsapp}
                        </a>
                      </>
                    )}
                  </p>
                  <p className="mt-1 text-sm text-tenue">
                    {estado.activa ? `Vence el ${fecha(b.venceEn)} (${estado.diasRestantes} días)` : `Venció el ${fecha(b.venceEn)}`}. {citasMes} citas en 30 días.
                  </p>
                </div>
                <a
                  href={`/${b.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-full border border-linea px-3 py-1.5 text-xs text-tenue transition hover:text-texto"
                >
                  <ArrowSquareOutIcon size={14} /> /{b.slug}
                </a>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-linea pt-4 text-xs">
                <span className="text-tenue">Extender:</span>
                {[7, 30, 90].map((d) => (
                  <form key={d} action={extenderBarberia.bind(null, b.id, d)}>
                    <button type="submit" className="rounded-full border border-linea px-3 py-1.5 transition hover:bg-white/10">
                      +{d} días
                    </button>
                  </form>
                ))}
                <form action={cambiarPlanBarberia.bind(null, b.id)} className="ml-2 flex items-center gap-1">
                  <label htmlFor={`plan-${b.id}`} className="text-tenue">
                    Plan:
                  </label>
                  <select id={`plan-${b.id}`} name="plan" defaultValue={b.plan} className="rounded-full border border-linea bg-superficie px-3 py-1.5 [color-scheme:dark]">
                    {PLANES.map((p) => (
                      <option key={p} value={p}>
                        {planes[p].nombre}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="rounded-full border border-linea px-3 py-1.5 transition hover:bg-white/10">
                    Cambiar
                  </button>
                </form>
                <form action={alternarSuspension.bind(null, b.id)} className="ml-auto">
                  <button
                    type="submit"
                    className={`rounded-full px-3 py-1.5 transition ${b.suspendida ? "border border-linea hover:bg-white/10" : "text-peligro hover:bg-peligro/15"}`}
                  >
                    {b.suspendida ? "Reactivar" : "Suspender"}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
