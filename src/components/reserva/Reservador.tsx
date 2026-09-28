"use client";

import { ArrowLeftIcon, CheckIcon, UsersThreeIcon, WarningIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { reservar } from "@/app/(sitio)/reservar/acciones";
import { Boton } from "@/components/sitio/Boton";
import type { Disponibilidad } from "@/lib/disponibilidad";
import { fmtDuracion, fmtFecha, fmtHora, fmtPrecio } from "@/lib/tiempo";
import { Calendario } from "./Calendario";

type ServicioUI = { id: number; nombre: string; descripcion: string; duracionMin: number; precio: number };
type BarberoUI = { id: number; nombre: string; especialidad: string; foto: string };
type Eleccion = number | "cualquiera" | null;

const PASOS = ["Servicio", "Barbero", "Fecha y hora", "Tus datos"];

type EstadoDispo =
  | { tipo: "cargando" }
  | { tipo: "error" }
  | { tipo: "listo"; hoy: string; dias: Disponibilidad };

export function Reservador({
  servicios,
  barberos,
  servicioInicial,
  barberoInicial,
}: {
  servicios: ServicioUI[];
  barberos: BarberoUI[];
  servicioInicial: number | null;
  barberoInicial: number | null;
}) {
  const router = useRouter();
  const reducir = useReducedMotion();
  const [servicioId, setServicioId] = useState<number | null>(servicioInicial);
  const [barbero, setBarbero] = useState<Eleccion>(barberoInicial);
  const [paso, setPaso] = useState(servicioInicial ? (barberoInicial ? 2 : 1) : 0);
  const [fecha, setFecha] = useState<string | null>(null);
  const [inicio, setInicio] = useState<number | null>(null);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [recarga, setRecarga] = useState(0);
  // Respuesta de disponibilidad etiquetada con la consulta que la produjo
  const [respuesta, setRespuesta] = useState<{ clave: string; estado: EstadoDispo } | null>(null);
  const [enviando, iniciar] = useTransition();

  const servicio = servicios.find((s) => s.id === servicioId) ?? null;
  const barberoElegido = typeof barbero === "number" ? barberos.find((b) => b.id === barbero) : null;

  // Carga las horas libres cuando ya hay servicio y barbero
  const clave = servicioId && barbero !== null ? `${servicioId}-${barbero}-${recarga}` : null;
  const dispo = useMemo<EstadoDispo>(
    () => (respuesta && respuesta.clave === clave ? respuesta.estado : { tipo: "cargando" }),
    [respuesta, clave],
  );

  useEffect(() => {
    if (!clave) return;
    let vigente = true;
    fetch(`/api/disponibilidad?servicio=${servicioId}&barbero=${barbero}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: { hoy: string; dias: Disponibilidad }) => {
        if (!vigente) return;
        setRespuesta({ clave, estado: { tipo: "listo", ...data } });
        const conHoras = Object.keys(data.dias).filter((f) => data.dias[f].length > 0);
        setFecha((actual) => (actual && data.dias[actual]?.length ? actual : (conHoras[0] ?? null)));
      })
      .catch(() => vigente && setRespuesta({ clave, estado: { tipo: "error" } }));
    return () => {
      vigente = false;
    };
  }, [clave, servicioId, barbero]);

  const habilitados = useMemo(
    () => (dispo.tipo === "listo" ? new Set(Object.keys(dispo.dias).filter((f) => dispo.dias[f].length > 0)) : new Set<string>()),
    [dispo],
  );
  const ultimoDia = dispo.tipo === "listo" ? Object.keys(dispo.dias).sort().at(-1)! : "";
  const huecos = dispo.tipo === "listo" && fecha ? (dispo.dias[fecha] ?? []) : [];
  const grupos = [
    { titulo: "Mañana", horas: huecos.filter((h) => h.inicio < 12 * 60) },
    { titulo: "Tarde", horas: huecos.filter((h) => h.inicio >= 12 * 60 && h.inicio < 18 * 60) },
    { titulo: "Noche", horas: huecos.filter((h) => h.inicio >= 18 * 60) },
  ].filter((g) => g.horas.length > 0);

  function elegirServicio(id: number) {
    setServicioId(id);
    setInicio(null);
    setError(null);
    setPaso(barbero !== null ? 2 : 1);
  }

  function elegirBarbero(b: Eleccion) {
    setBarbero(b);
    setInicio(null);
    setError(null);
    setPaso(2);
  }

  function confirmar(e: React.FormEvent) {
    e.preventDefault();
    if (!servicioId || barbero === null || !fecha || inicio === null) return;
    setError(null);
    iniciar(async () => {
      const r = await reservar({
        servicioId,
        barberoId: barbero === "cualquiera" ? null : barbero,
        fecha,
        inicio,
        nombre,
        telefono,
      });
      if (r.ok) {
        router.push(`/reserva/${r.codigo}`);
        return;
      }
      setError(r.error);
      if (r.horaOcupada) {
        setInicio(null);
        setPaso(2);
        setRecarga((n) => n + 1);
      }
    });
  }

  const puedeIr = (i: number) => i === 0 || (i === 1 && !!servicioId) || (i === 2 && !!servicioId && barbero !== null) || (i === 3 && inicio !== null);

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:gap-12">
      <div className="lg:col-span-8">
        {/* Progreso */}
        <ol className="mb-8 grid grid-cols-4 gap-2">
          {PASOS.map((p, i) => (
            <li key={p}>
              <button
                type="button"
                disabled={!puedeIr(i) || enviando}
                onClick={() => setPaso(i)}
                className="group w-full text-left disabled:cursor-default"
                aria-current={paso === i ? "step" : undefined}
              >
                <span className={`block h-1 rounded-full transition-colors ${i <= paso ? "bg-cromo" : "bg-white/10"}`} />
                <span className={`mt-2 block truncate text-xs sm:text-sm ${i === paso ? "text-texto" : "text-tenue"}`}>{p}</span>
              </button>
            </li>
          ))}
        </ol>

        {error && (
          <p role="alert" className="mb-6 flex items-start gap-2 rounded-xl border border-peligro/40 bg-peligro/10 px-4 py-3 text-sm text-peligro">
            <WarningIcon size={18} className="mt-0.5 shrink-0" /> {error}
          </p>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={paso}
            initial={reducir ? false : { opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reducir ? undefined : { opacity: 0, x: -16 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {paso === 0 && (
              <section aria-labelledby="t-servicio">
                <h2 id="t-servicio" className="mb-5 text-xl font-semibold">¿Qué te vas a hacer?</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {servicios.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => elegirServicio(s.id)}
                      className={`rounded-2xl p-5 text-left transition active:scale-[0.99] ${
                        s.id === servicioId ? "bg-cromo text-fondo" : "bg-superficie hover:bg-superficie-2"
                      }`}
                    >
                      <span className="flex items-start justify-between gap-4">
                        <span className="font-semibold">{s.nombre}</span>
                        <span className="font-semibold tabular-nums">{fmtPrecio(s.precio)}</span>
                      </span>
                      <span className={`mt-1 block text-sm ${s.id === servicioId ? "text-fondo/70" : "text-tenue"}`}>
                        {fmtDuracion(s.duracionMin)}. {s.descripcion}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {paso === 1 && (
              <section aria-labelledby="t-barbero">
                <h2 id="t-barbero" className="mb-5 text-xl font-semibold">¿Con quién?</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => elegirBarbero("cualquiera")}
                    className={`flex items-center gap-4 rounded-2xl p-4 text-left transition active:scale-[0.99] sm:col-span-2 ${
                      barbero === "cualquiera" ? "bg-cromo text-fondo" : "bg-superficie hover:bg-superficie-2"
                    }`}
                  >
                    <span className="grid size-16 shrink-0 place-items-center rounded-xl bg-white/10">
                      <UsersThreeIcon size={28} />
                    </span>
                    <span>
                      <span className="block font-semibold">El que esté disponible</span>
                      <span className={`block text-sm ${barbero === "cualquiera" ? "text-fondo/70" : "text-tenue"}`}>Más horarios para elegir</span>
                    </span>
                  </button>
                  {barberos.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => elegirBarbero(b.id)}
                      className={`flex items-center gap-4 rounded-2xl p-4 text-left transition active:scale-[0.99] ${
                        barbero === b.id ? "bg-cromo text-fondo" : "bg-superficie hover:bg-superficie-2"
                      }`}
                    >
                      <Image src={b.foto} alt="" width={64} height={64} className="size-16 shrink-0 rounded-xl object-cover" />
                      <span>
                        <span className="block font-semibold">{b.nombre}</span>
                        <span className={`block text-sm ${barbero === b.id ? "text-fondo/70" : "text-tenue"}`}>{b.especialidad}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {paso === 2 && (
              <section aria-labelledby="t-hora">
                <h2 id="t-hora" className="mb-5 text-xl font-semibold">¿Cuándo?</h2>
                {dispo.tipo === "cargando" && (
                  <div className="grid gap-6 md:grid-cols-2" aria-busy="true" aria-label="Cargando horarios">
                    <div className="aspect-square animate-pulse rounded-2xl bg-superficie" />
                    <div className="space-y-3">
                      {Array.from({ length: 4 }, (_, i) => (
                        <div key={i} className="h-11 animate-pulse rounded-full bg-superficie" />
                      ))}
                    </div>
                  </div>
                )}
                {dispo.tipo === "error" && (
                  <div className="rounded-2xl bg-superficie p-6">
                    <p>No pudimos cargar los horarios.</p>
                    <Boton variante="secundario" className="mt-4" onClick={() => setRecarga((n) => n + 1)}>
                      Reintentar
                    </Boton>
                  </div>
                )}
                {dispo.tipo === "listo" && habilitados.size === 0 && (
                  <div className="rounded-2xl bg-superficie p-6">
                    <p className="font-semibold">No hay horas libres en los próximos días.</p>
                    <p className="mt-1 text-sm text-tenue">Prueba con otro barbero o con la opción “El que esté disponible”.</p>
                    <Boton variante="secundario" className="mt-4" onClick={() => setPaso(1)}>
                      Cambiar barbero
                    </Boton>
                  </div>
                )}
                {dispo.tipo === "listo" && habilitados.size > 0 && (
                  <div className="grid gap-6 md:grid-cols-2">
                    <Calendario
                      hoy={dispo.hoy}
                      ultimo={ultimoDia}
                      habilitados={habilitados}
                      seleccion={fecha}
                      alElegir={(f) => {
                        setFecha(f);
                        setInicio(null);
                      }}
                    />
                    <div>
                      {fecha && <p className="mb-4 font-semibold first-letter:uppercase">{fmtFecha(fecha)}</p>}
                      <div className="space-y-5">
                        {grupos.map((g) => (
                          <div key={g.titulo}>
                            <p className="mb-2 text-sm text-tenue">{g.titulo}</p>
                            <div className="grid grid-cols-3 gap-2">
                              {g.horas.map((h) => (
                                <button
                                  key={h.inicio}
                                  type="button"
                                  onClick={() => {
                                    setInicio(h.inicio);
                                    setError(null);
                                    setPaso(3);
                                  }}
                                  className={`rounded-full px-2 py-2.5 text-sm tabular-nums transition active:scale-[0.97] ${
                                    h.inicio === inicio ? "bg-cromo font-semibold text-fondo" : "bg-superficie hover:bg-superficie-2"
                                  }`}
                                >
                                  {fmtHora(h.inicio)}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}

            {paso === 3 && (
              <section aria-labelledby="t-datos">
                <h2 id="t-datos" className="mb-5 text-xl font-semibold">Tus datos</h2>
                <form onSubmit={confirmar} className="max-w-md space-y-5">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="nombre" className="text-sm font-medium">Nombre</label>
                    <input
                      id="nombre"
                      required
                      minLength={2}
                      maxLength={60}
                      autoComplete="name"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="rounded-xl border border-linea bg-superficie px-4 py-3 outline-none transition placeholder:text-tenue focus:border-cromo"
                      placeholder="Ej. Santiago Bernal"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="telefono" className="text-sm font-medium">Celular (WhatsApp)</label>
                    <input
                      id="telefono"
                      required
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      minLength={7}
                      maxLength={20}
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="rounded-xl border border-linea bg-superficie px-4 py-3 outline-none transition placeholder:text-tenue focus:border-cromo"
                      placeholder="300 123 4567"
                    />
                    <p className="text-xs text-tenue">Solo lo usamos para confirmar o reprogramar tu cita.</p>
                  </div>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <Boton type="submit" disabled={enviando} className="px-8 py-3.5">
                      {enviando ? "Reservando..." : "Confirmar reserva"}
                    </Boton>
                    <Boton type="button" variante="secundario" onClick={() => setPaso(2)} disabled={enviando}>
                      <ArrowLeftIcon size={16} /> Cambiar hora
                    </Boton>
                  </div>
                </form>
              </section>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Resumen */}
      <aside className="lg:col-span-4">
        <div className="rounded-2xl border border-linea p-6 lg:sticky lg:top-24">
          <h2 className="text-sm font-medium text-tenue">Tu reserva</h2>
          <dl className="mt-4 space-y-4 text-sm">
            <Fila etiqueta="Servicio" valor={servicio ? `${servicio.nombre} (${fmtDuracion(servicio.duracionMin)})` : null} />
            <Fila
              etiqueta="Barbero"
              valor={barbero === "cualquiera" ? "El que esté disponible" : (barberoElegido?.nombre ?? null)}
            />
            <Fila
              etiqueta="Fecha y hora"
              valor={fecha && inicio !== null ? `${fmtFecha(fecha, { weekday: "short", day: "numeric", month: "short" })}, ${fmtHora(inicio)}` : null}
            />
          </dl>
          {servicio && (
            <div className="mt-6 flex items-baseline justify-between border-t border-linea pt-4">
              <span className="text-sm text-tenue">Total a pagar en el local</span>
              <span className="display text-xl font-semibold tabular-nums">{fmtPrecio(servicio.precio)}</span>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: string | null }) {
  return (
    <div className="flex items-start gap-3">
      <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${valor ? "bg-cromo text-fondo" : "border border-linea"}`}>
        {valor && <CheckIcon size={12} weight="bold" />}
      </span>
      <div>
        <dt className="text-tenue">{etiqueta}</dt>
        <dd className="mt-0.5 first-letter:uppercase">{valor ?? "Sin elegir"}</dd>
      </div>
    </div>
  );
}
