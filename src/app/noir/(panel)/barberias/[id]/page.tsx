import { ArrowLeftIcon, ArrowSquareOutIcon, SignInIcon, TrashIcon, WhatsappLogoIcon } from "@phosphor-icons/react/ssr";
import { asc, count, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PLANES, planes } from "@/config/planes";
import { getDb } from "@/db";
import { barberos, clientes, codigos, pagos, usuarios } from "@/db/schema";
import { enlaceRecordarRenovacion, etiquetaEstado, fechaCorta, fechaLarga, fmtUsd, listarBarberias } from "@/lib/noir";
import { exigirNoir } from "@/lib/sesion";
import { alternarSuspension, cambiarPlanBarberia, eliminarPago, entrarPanelBarberia, extenderBarberia, reactivarBarberia } from "../../../acciones";
import { CancelarPlan } from "../../pagos/CancelarPlan";
import { FormularioPago } from "../../pagos/FormularioPago";
import { CuentasBarberia } from "./CuentasBarberia";
import { EliminarBarberia } from "./EliminarBarberia";

export const dynamic = "force-dynamic";

export default async function DetalleBarberia({ params }: PageProps<"/noir/barberias/[id]">) {
  await exigirNoir();
  const id = Number((await params).id);
  const f = (await listarBarberias()).find((x) => x.b.id === id);
  if (!f) notFound();
  const { b, estado } = f;

  const db = await getDb();
  const [historial, usados, [{ totalClientes }], [{ totalBarberos }], cuentas] = await Promise.all([
    db.select().from(pagos).where(eq(pagos.barberiaId, id)).orderBy(desc(pagos.fecha)),
    db.select().from(codigos).where(eq(codigos.barberiaId, id)).orderBy(desc(codigos.usadoEn)),
    db.select({ totalClientes: count() }).from(clientes).where(eq(clientes.barberiaId, id)),
    db.select({ totalBarberos: count() }).from(barberos).where(eq(barberos.barberiaId, id)),
    db
      .select({ id: usuarios.id, nombre: usuarios.nombre, usuario: usuarios.usuario, rol: usuarios.rol })
      .from(usuarios)
      .where(eq(usuarios.barberiaId, id))
      .orderBy(asc(usuarios.id)),
  ]);
  const e = etiquetaEstado(f);
  const recordar = enlaceRecordarRenovacion(f);
  const pagado = historial.reduce((s, p) => s + p.montoCentavos, 0);
  const boton = "rounded-full border border-linea px-3 py-1.5 text-xs transition hover:bg-white/10";

  return (
    <div className="space-y-10">
      <div>
        <Link href="/noir/barberias" className="inline-flex items-center gap-2 text-sm text-tenue hover:text-texto">
          <ArrowLeftIcon size={16} /> Barberías
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex flex-wrap items-center gap-3 text-2xl font-semibold">
              {b.nombre}
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${e.clase}`}>{e.texto}</span>
            </h1>
            <p className="mt-1 text-sm text-tenue">
              {estado.activa ? `Activa hasta el ${fechaLarga(b.venceEn)} (${estado.diasRestantes} días)` : `Vencimiento: ${fechaLarga(b.venceEn)}`}. Cliente desde el{" "}
              {fechaLarga(b.creadoEn)}.
            </p>
            {estado.motivo === "cancelada" && (
              <p className="mt-1 text-sm text-peligro">
                Cancelada el {fechaLarga(b.canceladaEn!)}
                {b.motivoCancelacion && `: ${b.motivoCancelacion}`}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <form action={entrarPanelBarberia.bind(null, b.id)}>
              <button type="submit" className="inline-flex items-center gap-1.5 rounded-full bg-cromo px-4 py-2 text-sm font-semibold text-fondo transition hover:bg-white">
                <SignInIcon size={16} /> Entrar a su panel
              </button>
            </form>
            <a href={`/${b.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-linea px-4 py-2 text-sm transition hover:bg-white/10">
              <ArrowSquareOutIcon size={16} /> Ver web
            </a>
            {recordar && (
              <a
                href={recordar}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-[#0b1f12] transition hover:brightness-110"
              >
                <WhatsappLogoIcon size={16} weight="fill" /> Recordar renovación
              </a>
            )}
          </div>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { t: "Dueño", v: f.dueno ? `${f.dueno.nombre} (${f.dueno.usuario})` : "-" },
          { t: "WhatsApp", v: b.whatsapp ? `+${b.whatsapp}` : "-" },
          { t: "Actividad", v: `${f.citasMes} citas en 30 días, ${totalClientes} clientes, ${totalBarberos} barberos` },
          { t: "Total pagado", v: fmtUsd(pagado) },
        ].map((d) => (
          <div key={d.t} className="rounded-2xl bg-superficie p-4">
            <dt className="text-xs text-tenue">{d.t}</dt>
            <dd className="mt-1 text-sm font-semibold">{d.v}</dd>
          </div>
        ))}
      </dl>

      <section>
        <h2 className="text-lg font-semibold">Suscripción</h2>
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-linea p-4 text-sm">
          <span className="text-tenue">Extender:</span>
          {[7, 30, 90, 365].map((d) => (
            <form key={d} action={extenderBarberia.bind(null, b.id, d)}>
              <button type="submit" className={boton}>
                +{d} días
              </button>
            </form>
          ))}
          <form action={cambiarPlanBarberia.bind(null, b.id)} className="flex items-center gap-1 sm:ml-3">
            <label htmlFor="plan" className="text-tenue">
              Plan:
            </label>
            <select id="plan" name="plan" defaultValue={b.plan} className="rounded-full border border-linea bg-superficie px-3 py-1.5 text-xs [color-scheme:dark]">
              {PLANES.map((p) => (
                <option key={p} value={p}>
                  {planes[p].nombre}
                </option>
              ))}
            </select>
            <button type="submit" className={boton}>
              Cambiar
            </button>
          </form>
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            <form action={alternarSuspension.bind(null, b.id)}>
              <button type="submit" className={boton}>
                {b.suspendida ? "Quitar suspensión" : "Suspender"}
              </button>
            </form>
            {b.canceladaEn ? (
              <form action={reactivarBarberia.bind(null, b.id)}>
                <button type="submit" className="rounded-full bg-cromo px-3 py-1.5 text-xs font-semibold text-fondo transition hover:bg-white">
                  Reactivar plan
                </button>
              </form>
            ) : (
              <CancelarPlan id={b.id} />
            )}
          </div>
        </div>
        <p className="mt-2 text-xs text-tenue">
          Suspender es una pausa temporal. Cancelar termina el plan hoy; para volver, se reactiva o el dueño pone un código nuevo. En ningún caso se borran sus datos.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Cuentas del panel</h2>
        <p className="mt-1 text-sm text-tenue">El dueño y su equipo. Si alguien olvidó su contraseña, genérale una nueva.</p>
        <CuentasBarberia cuentas={cuentas} />
      </section>

      <section id="pago" className="scroll-mt-32">
        <h2 className="text-lg font-semibold">Registrar pago</h2>
        <FormularioPago barberias={[{ id: b.id, nombre: b.nombre, plan: b.plan }]} />
      </section>

      <section className="grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold">Pagos</h2>
          {historial.length === 0 ? (
            <p className="mt-3 text-sm text-tenue">Sin pagos registrados.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {historial.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 rounded-xl bg-superficie px-4 py-3 text-sm">
                  <div>
                    <p className="font-semibold tabular-nums">{fmtUsd(p.montoCentavos)}</p>
                    <p className="text-tenue">
                      {planes[p.plan].nombre}, {p.metodo}
                      {p.referencia && `, ref. ${p.referencia}`}, {fechaCorta(p.fecha)}
                    </p>
                  </div>
                  <form action={eliminarPago.bind(null, p.id)}>
                    <button type="submit" aria-label="Eliminar pago" className="grid size-8 place-items-center rounded-full text-tenue transition hover:bg-peligro/15 hover:text-peligro">
                      <TrashIcon size={16} />
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h2 className="text-lg font-semibold">Códigos usados</h2>
          {usados.length === 0 ? (
            <p className="mt-3 text-sm text-tenue">Ninguno.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {usados.map((c) => (
                <li key={c.id} className="rounded-xl bg-superficie px-4 py-3 text-sm">
                  <p className="font-mono tracking-widest">{c.codigo}</p>
                  <p className="text-tenue">
                    {planes[c.plan].nombre}, {c.dias} días{c.usadoEn && `, usado el ${fechaCorta(c.usadoEn)}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-peligro">Eliminar barbería</h2>
        <EliminarBarberia id={b.id} nombre={b.nombre} />
      </section>
    </div>
  );
}
