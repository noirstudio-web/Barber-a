import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react/ssr";
import { and, count, eq, gte, lte, ne, sql } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { barberos, citas, servicios } from "@/db/schema";
import { limitesPlan } from "@/lib/barberias";
import { exigirPanel } from "@/lib/sesion";
import { ahoraLocal, fmtFecha, fmtPrecio } from "@/lib/tiempo";

export const dynamic = "force-dynamic";

function rangoMes(mes: string) {
  const [a, m] = mes.split("-").map(Number);
  const desde = `${mes}-01`;
  const hasta = new Date(Date.UTC(a, m, 0)).toISOString().slice(0, 10);
  return { desde, hasta };
}

function mesVecino(mes: string, n: number) {
  const [a, m] = mes.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1 + n, 1)).toISOString().slice(0, 7);
}

// Resumen de un mes: citas por estado, ingresos atendidos y clientes que vinieron por primera vez
async function resumenMes(barberiaId: number, mes: string) {
  const { desde, hasta } = rangoMes(mes);
  const db = await getDb();
  const enMes = and(eq(citas.barberiaId, barberiaId), gte(citas.fecha, desde), lte(citas.fecha, hasta));
  // Primera visita de cada cliente, para contar los que llegaron por primera vez este mes
  const primeras = db
    .select({ clienteId: citas.clienteId, primera: sql<string>`min(${citas.fecha})`.as("primera") })
    .from(citas)
    .where(and(eq(citas.barberiaId, barberiaId), ne(citas.estado, "cancelada")))
    .groupBy(citas.clienteId)
    .as("primeras");
  const [[totales], [nuevos]] = await Promise.all([
    db
      .select({
        reservas: sql<number>`count(*) filter (where ${citas.estado} <> 'cancelada')::int`,
        atendidas: sql<number>`count(*) filter (where ${citas.estado} = 'completada')::int`,
        faltas: sql<number>`count(*) filter (where ${citas.estado} = 'no_asistio')::int`,
        canceladas: sql<number>`count(*) filter (where ${citas.estado} = 'cancelada')::int`,
        ingresos: sql<number>`coalesce(sum(${citas.precio}) filter (where ${citas.estado} = 'completada'), 0)::int`,
      })
      .from(citas)
      .where(enMes),
    db
      .select({ total: count() })
      .from(primeras)
      .where(and(gte(primeras.primera, desde), lte(primeras.primera, hasta))),
  ]);
  return { ...totales, nuevos: nuevos.total };
}

function Variacion({ actual, anterior }: { actual: number; anterior: number }) {
  if (anterior === 0) return null;
  const cambio = Math.round(((actual - anterior) / anterior) * 100);
  if (cambio === 0) return <span className="text-xs text-tenue">igual que el mes anterior</span>;
  return (
    <span className={`text-xs ${cambio > 0 ? "text-exito" : "text-peligro"}`}>
      {cambio > 0 ? "+" : ""}
      {cambio}% vs. mes anterior
    </span>
  );
}

export default async function Estadisticas({ searchParams }: PageProps<"/admin/estadisticas">) {
  const { barberia } = await exigirPanel();
  if (!limitesPlan(barberia).herramientasPremium) redirect("/admin/suscripcion");
  const params = await searchParams;
  const hoy = ahoraLocal().fecha;
  const mesActual = hoy.slice(0, 7);
  const mes = typeof params.mes === "string" && /^\d{4}-\d{2}$/.test(params.mes) && params.mes <= mesActual ? params.mes : mesActual;
  const { desde, hasta } = rangoMes(mes);

  const db = await getDb();
  const enMes = and(eq(citas.barberiaId, barberia.id), gte(citas.fecha, desde), lte(citas.fecha, hasta));
  const [actual, anterior, porServicio, porBarbero] = await Promise.all([
    resumenMes(barberia.id, mes),
    resumenMes(barberia.id, mesVecino(mes, -1)),
    db
      .select({
        nombre: servicios.nombre,
        veces: sql<number>`count(*)::int`,
        ingresos: sql<number>`sum(${citas.precio})::int`,
      })
      .from(citas)
      .innerJoin(servicios, eq(citas.servicioId, servicios.id))
      .where(and(enMes, eq(citas.estado, "completada")))
      .groupBy(servicios.nombre)
      .orderBy(sql`count(*) desc`),
    db
      .select({
        nombre: barberos.nombre,
        atendidas: sql<number>`count(*) filter (where ${citas.estado} = 'completada')::int`,
        faltas: sql<number>`count(*) filter (where ${citas.estado} = 'no_asistio')::int`,
        ingresos: sql<number>`coalesce(sum(${citas.precio}) filter (where ${citas.estado} = 'completada'), 0)::int`,
      })
      .from(citas)
      .innerJoin(barberos, eq(citas.barberoId, barberos.id))
      .where(enMes)
      .groupBy(barberos.nombre)
      .orderBy(sql`4 desc`),
  ]);

  const ticket = actual.atendidas ? Math.round(actual.ingresos / actual.atendidas) : 0;
  const ticketAnterior = anterior.atendidas ? Math.round(anterior.ingresos / anterior.atendidas) : 0;
  const cerradas = actual.atendidas + actual.faltas;
  const tasaFaltas = cerradas ? Math.round((actual.faltas / cerradas) * 100) : 0;
  const maxServicio = Math.max(1, ...porServicio.map((s) => s.veces));
  const maxBarbero = Math.max(1, ...porBarbero.map((b) => b.ingresos));
  const titulo = fmtFecha(desde, { month: "long", year: "numeric" });

  const tarjetas = [
    { t: "Ingresos atendidos", v: fmtPrecio(actual.ingresos), a: actual.ingresos, b: anterior.ingresos },
    { t: "Citas reservadas", v: String(actual.reservas), a: actual.reservas, b: anterior.reservas },
    { t: "Ticket promedio", v: fmtPrecio(ticket), a: ticket, b: ticketAnterior },
    { t: "Clientes nuevos", v: String(actual.nuevos), a: actual.nuevos, b: anterior.nuevos },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold first-letter:uppercase">Estadísticas de {titulo}</h1>
        <div className="flex gap-2">
          <Link href={`/admin/estadisticas?mes=${mesVecino(mes, -1)}`} aria-label="Mes anterior" className="grid size-10 place-items-center rounded-full border border-linea hover:bg-white/5">
            <CaretLeftIcon size={16} />
          </Link>
          {mes < mesActual && (
            <Link href={`/admin/estadisticas?mes=${mesVecino(mes, 1)}`} aria-label="Mes siguiente" className="grid size-10 place-items-center rounded-full border border-linea hover:bg-white/5">
              <CaretRightIcon size={16} />
            </Link>
          )}
        </div>
      </div>
      {mes === mesActual && <p className="mt-1 text-sm text-tenue">Mes en curso, hasta el {fmtFecha(hoy, { day: "numeric", month: "long" })}.</p>}

      <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tarjetas.map((t) => (
          <div key={t.t} className="rounded-2xl bg-superficie p-5">
            <dt className="text-xs text-tenue">{t.t}</dt>
            <dd className="display mt-1 text-2xl font-semibold tabular-nums">{t.v}</dd>
            <dd className="mt-1">
              <Variacion actual={t.a} anterior={t.b} />
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 text-sm text-tenue">
        {actual.atendidas} atendidas, {actual.faltas} no asistieron ({tasaFaltas}% de faltas) y {actual.canceladas} canceladas.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="text-lg font-semibold">Servicios más vendidos</h2>
          {porServicio.length === 0 ? (
            <p className="mt-4 text-sm text-tenue">Aún no hay citas atendidas este mes.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {porServicio.map((s) => (
                <li key={s.nombre} className="text-sm">
                  <div className="flex justify-between gap-4">
                    <span>{s.nombre}</span>
                    <span className="tabular-nums text-tenue">
                      {s.veces} {s.veces === 1 ? "vez" : "veces"}, {fmtPrecio(s.ingresos)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-cromo/80" style={{ width: `${(s.veces / maxServicio) * 100}%` }} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold">Rendimiento por barbero</h2>
          {porBarbero.length === 0 ? (
            <p className="mt-4 text-sm text-tenue">Aún no hay citas este mes.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {porBarbero.map((b) => (
                <li key={b.nombre} className="text-sm">
                  <div className="flex justify-between gap-4">
                    <span>{b.nombre}</span>
                    <span className="tabular-nums text-tenue">
                      {b.atendidas} atendidas{b.faltas > 0 && `, ${b.faltas} faltas`}, {fmtPrecio(b.ingresos)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-cromo/80" style={{ width: `${Math.max(2, (b.ingresos / maxBarbero) * 100)}%` }} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
