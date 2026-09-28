import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react/ssr";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import Link from "next/link";
import { horario } from "@/config/negocio";
import { getDb } from "@/db";
import { barberos, bloqueos, citas, clientes, type EstadoCita, servicios } from "@/db/schema";
import { ahoraLocal, diaSemana, esFechaValida, fmtFecha, fmtHora, fmtPrecio, inicioSemana, sumarDias } from "@/lib/tiempo";
import { CitaTarjeta } from "./CitaTarjeta";
import { ESTILO_ESTADO } from "./estados";

export const dynamic = "force-dynamic";

const PX_POR_MIN = 1.5;

export default async function Agenda({ searchParams }: PageProps<"/admin">) {
  const params = await searchParams;
  const hoy = ahoraLocal();
  const fecha = typeof params.fecha === "string" && esFechaValida(params.fecha) ? params.fecha : hoy.fecha;
  const vista = params.vista === "semana" ? "semana" : "dia";
  const desde = vista === "semana" ? inicioSemana(fecha) : fecha;
  const hasta = vista === "semana" ? sumarDias(desde, 6) : fecha;

  const db = await getDb();
  const [equipo, filas, bloqs] = await Promise.all([
    db.select().from(barberos).where(eq(barberos.activo, true)).orderBy(asc(barberos.orden)),
    db
      .select({
        id: citas.id,
        barberoId: citas.barberoId,
        fecha: citas.fecha,
        inicioMin: citas.inicioMin,
        finMin: citas.finMin,
        estado: citas.estado,
        precio: citas.precio,
        cliente: clientes.nombre,
        telefono: clientes.telefono,
        servicio: servicios.nombre,
      })
      .from(citas)
      .innerJoin(clientes, eq(citas.clienteId, clientes.id))
      .innerJoin(servicios, eq(citas.servicioId, servicios.id))
      .where(and(gte(citas.fecha, desde), lte(citas.fecha, hasta)))
      .orderBy(asc(citas.fecha), asc(citas.inicioMin)),
    db.select().from(bloqueos).where(and(lte(bloqueos.desde, hasta), gte(bloqueos.hasta, desde))),
  ]);

  const activas = filas.filter((c) => c.estado !== "cancelada");
  const ingresos = activas.filter((c) => c.estado !== "no_asistio").reduce((t, c) => t + c.precio, 0);
  const paso = vista === "semana" ? 7 : 1;
  const url = (f: string, v: string = vista) => `/admin?fecha=${f}&vista=${v}`;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold first-letter:uppercase">
            {vista === "dia"
              ? fmtFecha(fecha, { weekday: "long", day: "numeric", month: "long" })
              : `Semana del ${fmtFecha(desde, { day: "numeric", month: "short" })} al ${fmtFecha(hasta, { day: "numeric", month: "short" })}`}
          </h1>
          <p className="mt-1 text-sm text-tenue">
            {activas.length} {activas.length === 1 ? "cita" : "citas"}, {fmtPrecio(ingresos)} estimados
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full border border-linea p-1 text-sm">
            <Link href={url(fecha, "dia")} className={`rounded-full px-3 py-1.5 ${vista === "dia" ? "bg-white/10" : "text-tenue"}`}>
              Día
            </Link>
            <Link href={url(fecha, "semana")} className={`rounded-full px-3 py-1.5 ${vista === "semana" ? "bg-white/10" : "text-tenue"}`}>
              Semana
            </Link>
          </div>
          <Link href={url(sumarDias(fecha, -paso))} aria-label="Anterior" className="grid size-10 place-items-center rounded-full border border-linea hover:bg-white/5">
            <CaretLeftIcon size={16} />
          </Link>
          <Link href={url(hoy.fecha)} className="rounded-full border border-linea px-4 py-2 text-sm hover:bg-white/5">
            Hoy
          </Link>
          <Link href={url(sumarDias(fecha, paso))} aria-label="Siguiente" className="grid size-10 place-items-center rounded-full border border-linea hover:bg-white/5">
            <CaretRightIcon size={16} />
          </Link>
          <form action="/admin" className="flex">
            <input type="hidden" name="vista" value={vista} />
            <input
              type="date"
              key={fecha}
              name="fecha"
              defaultValue={fecha}
              aria-label="Ir a fecha"
              className="rounded-full border border-linea bg-transparent px-3 py-2 text-sm [color-scheme:dark]"
            />
            <button type="submit" className="ml-1 rounded-full border border-linea px-3 text-sm hover:bg-white/5">
              Ir
            </button>
          </form>
        </div>
      </div>

      {vista === "dia" ? (
        <VistaDia fecha={fecha} equipo={equipo} citas={filas} bloqueos={bloqs} ahora={fecha === hoy.fecha ? hoy.minutos : null} />
      ) : (
        <VistaSemana desde={desde} hoy={hoy.fecha} equipo={equipo} citas={filas} bloqueos={bloqs} />
      )}

      <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-tenue">
        {Object.values(ESTILO_ESTADO).map((e) => (
          <li key={e.etiqueta} className="flex items-center gap-2">
            <span className={`h-3 border-l-2 ${e.borde}`} /> {e.etiqueta}
          </li>
        ))}
      </ul>
    </div>
  );
}

type FilaCita = {
  id: number;
  barberoId: number;
  fecha: string;
  inicioMin: number;
  finMin: number;
  estado: EstadoCita;
  cliente: string;
  telefono: string;
  servicio: string;
};
type FilaBloqueo = typeof bloqueos.$inferSelect;
type Barbero = typeof barberos.$inferSelect;

function bloqueosDe(bloqs: FilaBloqueo[], barberoId: number, fecha: string) {
  return bloqs.filter((b) => (b.barberoId === null || b.barberoId === barberoId) && b.desde <= fecha && b.hasta >= fecha);
}

function VistaDia({
  fecha,
  equipo,
  citas: lista,
  bloqueos: bloqs,
  ahora,
}: {
  fecha: string;
  equipo: Barbero[];
  citas: FilaCita[];
  bloqueos: FilaBloqueo[];
  ahora: number | null;
}) {
  const jornada = horario[diaSemana(fecha)];
  const abre = jornada?.abre ?? 8 * 60;
  const cierra = jornada?.cierra ?? 20 * 60;
  const alto = (cierra - abre) * PX_POR_MIN;
  const horas = Array.from({ length: Math.floor((cierra - abre) / 60) + 1 }, (_, i) => abre + i * 60);

  return (
    <div className="mt-8 overflow-x-auto rounded-2xl border border-linea">
      {!jornada && <p className="border-b border-linea bg-superficie px-4 py-3 text-sm text-tenue">La barbería no abre este día según el horario.</p>}
      <div className="grid min-w-[720px]" style={{ gridTemplateColumns: `4rem repeat(${equipo.length}, minmax(10rem, 1fr))` }}>
        <div className="sticky left-0 z-10 border-b border-r border-linea bg-fondo" />
        {equipo.map((b) => (
          <div key={b.id} className="border-b border-linea px-3 py-3 text-sm font-semibold">
            {b.nombre}
          </div>
        ))}

        <div className="sticky left-0 z-10 border-r border-linea bg-fondo" style={{ height: alto }}>
          {horas.map((h) => (
            <span key={h} className="absolute -translate-y-1/2 px-2 text-[11px] tabular-nums text-tenue" style={{ top: (h - abre) * PX_POR_MIN }}>
              {fmtHora(h).replace(":00", "")}
            </span>
          ))}
        </div>

        {equipo.map((b) => (
          <div key={b.id} className="relative border-r border-linea last:border-r-0" style={{ height: alto }}>
            {horas.map((h) => (
              <div key={h} className="absolute inset-x-0 border-t border-white/[0.04]" style={{ top: (h - abre) * PX_POR_MIN }} />
            ))}
            {bloqueosDe(bloqs, b.id, fecha).map((bl) => {
              const i = Math.max(bl.inicioMin ?? abre, abre);
              const f = Math.min(bl.finMin ?? cierra, cierra);
              if (f <= i) return null;
              return (
                <div
                  key={bl.id}
                  className="absolute inset-x-0 bg-[repeating-linear-gradient(135deg,rgb(255_255_255/0.04)_0_6px,transparent_6px_12px)] px-2 py-1 text-[11px] text-tenue"
                  style={{ top: (i - abre) * PX_POR_MIN, height: (f - i) * PX_POR_MIN }}
                >
                  {bl.motivo || "Bloqueado"}
                </div>
              );
            })}
            {lista
              .filter((c) => c.barberoId === b.id)
              // Las canceladas se dibujan primero para que las activas queden encima
              .sort((x, y) => Number(y.estado === "cancelada") - Number(x.estado === "cancelada"))
              .map((c) => (
                <CitaTarjeta
                  key={c.id}
                  cita={c}
                  estilo={{ top: (c.inicioMin - abre) * PX_POR_MIN + 1, height: (c.finMin - c.inicioMin) * PX_POR_MIN - 2 }}
                />
              ))}
            {ahora !== null && ahora > abre && ahora < cierra && (
              <div className="pointer-events-none absolute inset-x-0 z-10 border-t border-peligro" style={{ top: (ahora - abre) * PX_POR_MIN }} aria-hidden />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function VistaSemana({
  desde,
  hoy,
  equipo,
  citas: lista,
  bloqueos: bloqs,
}: {
  desde: string;
  hoy: string;
  equipo: Barbero[];
  citas: FilaCita[];
  bloqueos: FilaBloqueo[];
}) {
  const dias = Array.from({ length: 7 }, (_, i) => sumarDias(desde, i));
  return (
    <div className="mt-8 overflow-x-auto rounded-2xl border border-linea">
      <table className="w-full min-w-[900px] table-fixed text-sm">
        <thead>
          <tr>
            <th className="w-36 border-b border-linea px-3 py-3 text-left font-normal text-tenue">Barbero</th>
            {dias.map((d) => (
              <th key={d} className={`border-b border-linea px-2 py-3 text-left font-semibold ${d === hoy ? "text-texto" : ""}`}>
                <Link href={`/admin?fecha=${d}&vista=dia`} className="capitalize hover:underline">
                  {fmtFecha(d, { weekday: "short", day: "numeric" })}
                </Link>
                {!horario[diaSemana(d)] && <span className="block text-xs font-normal text-tenue">Cerrado</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {equipo.map((b) => (
            <tr key={b.id} className="align-top">
              <td className="border-b border-linea px-3 py-3 font-semibold">{b.nombre}</td>
              {dias.map((d) => {
                const delDia = lista.filter((c) => c.barberoId === b.id && c.fecha === d && c.estado !== "cancelada");
                const bl = bloqueosDe(bloqs, b.id, d);
                return (
                  <td key={d} className={`border-b border-l border-linea p-1.5 ${d === hoy ? "bg-white/[0.02]" : ""}`}>
                    {bl.map((x) => (
                      <p key={x.id} className="mb-1 rounded-md bg-white/[0.04] px-2 py-1 text-[11px] text-tenue">
                        {x.inicioMin === null ? "Día bloqueado" : `${fmtHora(x.inicioMin)} a ${fmtHora(x.finMin!)}`}
                        {x.motivo && `: ${x.motivo}`}
                      </p>
                    ))}
                    {delDia.map((c) => (
                      <p key={c.id} className={`mb-1 truncate border-l-2 bg-superficie-2 px-2 py-1 text-xs ${ESTILO_ESTADO[c.estado].borde}`}>
                        <span className="tabular-nums text-tenue">{fmtHora(c.inicioMin).replace(" ", " ")}</span> {c.cliente}
                      </p>
                    ))}
                    {delDia.length === 0 && bl.length === 0 && <span className="block px-2 py-1 text-xs text-tenue/50">Libre</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
