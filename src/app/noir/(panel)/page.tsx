import { WarningCircleIcon, WhatsappLogoIcon } from "@phosphor-icons/react/ssr";
import { desc, gte } from "drizzle-orm";
import Link from "next/link";
import { planes } from "@/config/planes";
import { getDb } from "@/db";
import { pagos } from "@/db/schema";
import { enlaceRecordarRenovacion, etiquetaEstado, fechaCorta, fechaLarga, fmtUsd, listarBarberias, type FilaBarberia } from "@/lib/noir";
import { exigirNoir } from "@/lib/sesion";

export const dynamic = "force-dynamic";

function FilaAlerta({ f }: { f: FilaBarberia }) {
  const recordar = enlaceRecordarRenovacion(f);
  const e = etiquetaEstado(f);
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-superficie px-4 py-3 text-sm">
      <div>
        <Link href={`/noir/barberias/${f.b.id}`} className="font-semibold hover:underline">
          {f.b.nombre}
        </Link>
        <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${e.clase}`}>{e.texto}</span>
        <p className="mt-0.5 text-tenue">
          {f.dueno?.nombre ?? "Sin dueño"},{" "}
          {f.estado.activa
            ? `vence el ${fechaLarga(f.b.venceEn)} (${f.estado.diasRestantes} ${f.estado.diasRestantes === 1 ? "día" : "días"})`
            : `venció el ${fechaLarga(f.b.venceEn)}`}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {recordar && (
          <a
            href={recordar}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-[#0b1f12] transition hover:brightness-110"
          >
            <WhatsappLogoIcon size={14} weight="fill" /> Recordar renovación
          </a>
        )}
        <Link href={`/noir/barberias/${f.b.id}#pago`} className="rounded-full border border-linea px-3 py-1.5 text-xs transition hover:bg-white/10">
          Registrar pago
        </Link>
      </div>
    </li>
  );
}

export default async function ResumenNoir() {
  await exigirNoir();
  const db = await getDb();
  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const [todas, pagosMes, ultimos] = await Promise.all([
    listarBarberias(),
    db.select().from(pagos).where(gte(pagos.fecha, inicioMes)),
    db.select().from(pagos).orderBy(desc(pagos.fecha)).limit(5),
  ]);
  // La demo no cuenta como cliente
  const clientes = todas.filter((f) => !f.esDemo);
  const activas = clientes.filter((f) => f.estado.activa);
  const porVencer = clientes.filter((f) => f.porVencer).sort((a, b) => a.b.venceEn.getTime() - b.b.venceEn.getTime());
  const vencidas = clientes.filter((f) => f.estado.motivo === "vencida").sort((a, b) => b.b.venceEn.getTime() - a.b.venceEn.getTime());

  const resumen = [
    { t: "Barberías activas", v: activas.length },
    { t: "En prueba gratis", v: activas.filter((f) => f.b.plan === "prueba").length },
    { t: "Ingresos este mes", v: fmtUsd(pagosMes.reduce((s, p) => s + p.montoCentavos, 0)) },
    { t: "Ingreso mensual esperado", v: `${activas.reduce((s, f) => s + planes[f.b.plan].precioUsd, 0)} USD` },
  ];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold">Resumen</h1>
        <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {resumen.map((r) => (
            <div key={r.t} className="rounded-2xl bg-superficie p-5">
              <dt className="text-xs text-tenue">{r.t}</dt>
              <dd className="display mt-1 text-2xl font-semibold tabular-nums">{r.v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/noir/codigos" className="rounded-full bg-cromo px-5 py-2.5 text-sm font-semibold text-fondo transition hover:bg-white">
            Generar código de activación
          </Link>
          <Link href="/noir/pagos" className="rounded-full border border-linea px-5 py-2.5 text-sm transition hover:bg-white/10">
            Registrar pago
          </Link>
        </div>
      </div>

      <section>
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <WarningCircleIcon size={20} className={porVencer.length ? "text-amber-300" : "text-tenue"} /> Vencen en los próximos 7 días
        </h2>
        {porVencer.length === 0 ? (
          <p className="mt-3 text-sm text-tenue">Ninguna barbería vence esta semana.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {porVencer.map((f) => (
              <FilaAlerta key={f.b.id} f={f} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <WarningCircleIcon size={20} className={vencidas.length ? "text-peligro" : "text-tenue"} /> Vencidas sin renovar
        </h2>
        <p className="mt-1 text-sm text-tenue">Su web está en pausa hasta que renueven.</p>
        {vencidas.length === 0 ? (
          <p className="mt-3 text-sm text-tenue">No hay barberías vencidas.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {vencidas.map((f) => (
              <FilaAlerta key={f.b.id} f={f} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-lg font-semibold">Últimos pagos</h2>
          <Link href="/noir/pagos" className="text-sm text-tenue underline-offset-4 hover:text-texto hover:underline">
            Ver todos
          </Link>
        </div>
        {ultimos.length === 0 ? (
          <p className="mt-3 text-sm text-tenue">Todavía no has registrado pagos.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {ultimos.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-superficie px-4 py-3 text-sm">
                <span>
                  <span className="font-semibold">{p.cliente || "Sin nombre"}</span>
                  <span className="text-tenue">
                    {" "}
                    {planes[p.plan].nombre}, {p.metodo}, {fechaCorta(p.fecha)}
                  </span>
                </span>
                <span className="font-semibold tabular-nums">{fmtUsd(p.montoCentavos)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
