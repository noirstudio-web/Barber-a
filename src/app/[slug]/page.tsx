import { ArrowUpRightIcon, InstagramLogoIcon, NavigationArrowIcon, WhatsappLogoIcon } from "@phosphor-icons/react/ssr";
import Image from "next/image";
import Link from "next/link";
import { BotonEnlace, BotonExterno } from "@/components/sitio/Boton";
import { Revelar } from "@/components/sitio/Revelar";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/sitio/Avatar";
import { beneficios } from "@/config/contenido";
import { nombresDias } from "@/config/region";
import { barberiaPorSlug, limitesPlan } from "@/lib/barberias";
import { barberosActivos, galeriaDe, resenasDe, serviciosActivos } from "@/lib/datos";
import { fmtDuracion, fmtHora, fmtPrecio } from "@/lib/tiempo";
import { enlaceWhatsApp } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export default async function InicioBarberia({ params }: PageProps<"/[slug]">) {
  const negocio = await barberiaPorSlug((await params).slug);
  if (!negocio) notFound();
  const conExtras = limitesPlan(negocio).galeriaYResenas;
  const [servicios, barberos, galeria, resenas] = await Promise.all([
    serviciosActivos(negocio.id),
    barberosActivos(negocio.id),
    conExtras ? galeriaDe(negocio.id) : [],
    conExtras ? resenasDe(negocio.id) : [],
  ]);
  const base = `/${negocio.slug}`;
  // La última palabra del eslogan lleva el brillo cromado
  const eslogan = (negocio.eslogan || "Tu corte, a la hora que elijas.").trim();
  const corte = eslogan.lastIndexOf(" ");
  const [inicioEslogan, finEslogan] = corte > 0 ? [eslogan.slice(0, corte + 1), eslogan.slice(corte + 1)] : ["", eslogan];

  return (
    <>
      {/* Portada */}
      <section className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-7xl items-center gap-10 px-4 py-10 md:px-8 lg:grid-cols-12 lg:py-12">
        <div className="lg:col-span-7">
          <Revelar>
            <p className="mb-6 text-xs font-medium uppercase tracking-[0.3em] text-tenue">{negocio.nombre}</p>
          </Revelar>
          <Revelar retraso={0.08}>
            <h1 className="display text-5xl font-semibold leading-[1.02] md:text-6xl xl:text-7xl">
              {inicioEslogan}
              <em className="cromado not-italic">{finEslogan}</em>
            </h1>
          </Revelar>
          <Revelar retraso={0.16}>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-tenue">
              Escoge servicio, barbero y hora en menos de un minuto. Te confirmamos al instante.
            </p>
          </Revelar>
          <Revelar retraso={0.24}>
            <div className="mt-9 flex flex-wrap gap-3">
              <BotonEnlace href={`${base}/reservar`} className="px-8 py-4 text-base">
                Reservar cita
              </BotonEnlace>
              <BotonEnlace href="#servicios" variante="secundario" className="px-8 py-4 text-base">
                Ver precios
              </BotonEnlace>
            </div>
          </Revelar>
        </div>
        <Revelar retraso={0.1} className="lg:col-span-5">
          <div className="relative aspect-[4/5] max-h-[78dvh] w-full overflow-hidden rounded-2xl">
            <Image
              src={negocio.portada ?? "/img/hero.jpg"}
              alt={`Foto de ${negocio.nombre}`}
              fill
              priority
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-fondo/60 via-transparent to-transparent" />
          </div>
        </Revelar>
      </section>

      {/* Servicios y precios */}
      <section id="servicios" className="scroll-mt-16 border-t border-linea">
        <div className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
          <Revelar>
            <h2 className="display max-w-2xl text-4xl font-semibold leading-tight md:text-5xl">Servicios y precios</h2>
            <p className="mt-4 max-w-[60ch] text-tenue">Precios finales, sin sorpresas. Toca un servicio para reservarlo.</p>
          </Revelar>
          <div className="mt-12 grid gap-3 md:grid-cols-2">
            {servicios.map((s, i) => (
              <Revelar key={s.id} retraso={(i % 2) * 0.06}>
                <Link
                  href={`${base}/reservar?servicio=${s.id}`}
                  className="group flex items-start justify-between gap-6 rounded-2xl bg-superficie p-6 transition duration-300 hover:bg-superficie-2"
                >
                  <div>
                    <h3 className="text-lg font-semibold">{s.nombre}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-tenue">{s.descripcion}</p>
                    <p className="mt-3 text-xs text-tenue">{fmtDuracion(s.duracionMin)}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-3">
                    <span className="display text-xl font-semibold tabular-nums">{fmtPrecio(s.precio)}</span>
                    <span className="grid size-9 place-items-center rounded-full border border-linea text-tenue transition group-hover:border-cromo group-hover:bg-cromo group-hover:text-fondo">
                      <ArrowUpRightIcon size={16} aria-label={`Reservar ${s.nombre}`} />
                    </span>
                  </div>
                </Link>
              </Revelar>
            ))}
          </div>
        </div>
      </section>

      {/* El local y por qué reservar */}
      <section className="relative isolate overflow-hidden">
        <Image src="/img/local.jpg" alt="Interior de la barbería con sillas clásicas y paredes de ladrillo" fill sizes="100vw" className="-z-10 object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-fondo via-fondo/85 to-fondo/40" />
        <div className="mx-auto max-w-7xl px-4 py-24 md:px-8 md:py-36">
          <Revelar>
            <h2 className="display max-w-xl text-4xl font-semibold leading-tight md:text-5xl">Llegas a tu hora. Te atendemos a tu hora.</h2>
          </Revelar>
          <div className="mt-14 grid max-w-3xl gap-8 sm:grid-cols-3">
            {beneficios.map((b, i) => (
              <Revelar key={b.titulo} retraso={i * 0.08}>
                <div className="border-l border-cromo/40 pl-5">
                  <h3 className="font-semibold">{b.titulo}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-tenue">{b.texto}</p>
                </div>
              </Revelar>
            ))}
          </div>
        </div>
      </section>

      {/* Barberos */}
      <section id="barberos" className="scroll-mt-16">
        <div className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
          <Revelar>
            <h2 className="display text-4xl font-semibold leading-tight md:text-5xl">El equipo</h2>
            <p className="mt-4 max-w-[60ch] text-tenue">Cada uno tiene su especialidad. Reserva con el que prefieras.</p>
          </Revelar>
          <div className="mt-14 grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {barberos.map((b, i) => (
              <Revelar key={b.id} retraso={i * 0.07} className={i % 2 === 1 ? "lg:translate-y-12" : ""}>
                <Link href={`${base}/reservar?barbero=${b.id}`} className="group block">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
                    {b.foto ? (
                      <Image
                        src={b.foto}
                        alt={`Retrato de ${b.nombre}`}
                        fill
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover grayscale transition duration-700 group-hover:scale-[1.03] group-hover:grayscale-0"
                      />
                    ) : (
                      <Avatar nombre={b.nombre} className="size-full text-6xl" />
                    )}
                  </div>
                  <div className="mt-4 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">{b.nombre}</h3>
                      <p className="text-sm text-texto/80">{b.especialidad}</p>
                      <p className="mt-1 text-sm text-tenue">{b.estilo}</p>
                    </div>
                    <ArrowUpRightIcon size={18} className="mt-1 shrink-0 text-tenue transition group-hover:text-texto" aria-label={`Reservar con ${b.nombre}`} />
                  </div>
                </Link>
              </Revelar>
            ))}
          </div>
        </div>
      </section>

      {/* Galería (solo en planes que la incluyen y si hay fotos) */}
      {galeria.length > 0 && (
      <section id="galeria" className="scroll-mt-16 border-t border-linea">
        <div className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
          <Revelar>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-tenue">Galería</p>
                <h2 className="display text-4xl font-semibold leading-tight md:text-5xl">Trabajos recientes</h2>
              </div>
              {negocio.instagram && (
                <BotonExterno href={negocio.instagram} variante="secundario">
                  <InstagramLogoIcon size={18} /> Seguir en Instagram
                </BotonExterno>
              )}
            </div>
          </Revelar>
          <div className="mt-12 columns-2 gap-3 md:columns-3 md:gap-4">
            {galeria.map((g, i) => (
              <Revelar key={g.id} retraso={(i % 3) * 0.06} className="mb-3 break-inside-avoid md:mb-4">
                <div className="group overflow-hidden rounded-2xl">
                  <Image
                    src={g.url}
                    alt={g.alt || `Trabajo de ${negocio.nombre}`}
                    width={g.ancho}
                    height={g.alto}
                    sizes="(min-width: 768px) 33vw, 50vw"
                    className="h-auto w-full transition duration-700 group-hover:scale-[1.04]"
                  />
                </div>
              </Revelar>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* Reseñas */}
      {resenas.length > 0 && (
      <section className="overflow-hidden border-t border-linea py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <Revelar>
            <h2 className="display text-4xl font-semibold leading-tight md:text-5xl">Lo que dicen nuestros clientes</h2>
          </Revelar>
        </div>
        <div className="mt-12 flex w-max gap-4 desfile">
          {[...resenas, ...resenas].map((r, i) => (
            <figure key={i} aria-hidden={i >= resenas.length} className="w-[20rem] shrink-0 rounded-2xl bg-superficie p-6 md:w-[24rem]">
              <blockquote className="leading-relaxed">“{r.texto}”</blockquote>
              <figcaption className="mt-5 text-sm">
                <span className="font-semibold">{r.nombre}</span>
                {r.detalle && <span className="text-tenue"> - {r.detalle}</span>}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
      )}

      {/* Ubicación y horario */}
      <section id="ubicacion" className="scroll-mt-16 border-t border-linea">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 md:px-8 md:py-28 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Revelar>
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-tenue">Visítanos</p>
              <h2 className="display text-4xl font-semibold leading-tight md:text-5xl">Ubicación y horario</h2>
              <p className="mt-5 text-lg">{negocio.direccion}</p>
              <dl className="mt-8 grid grid-cols-[auto_1fr] gap-x-8 gap-y-2.5 text-sm">
                {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                  const h = negocio.horario[d];
                  return (
                    <div key={d} className="contents">
                      <dt className="text-tenue">{nombresDias[d]}</dt>
                      <dd className="tabular-nums">{h ? `${fmtHora(h.abre)} a ${fmtHora(h.cierra)}` : "Cerrado"}</dd>
                    </div>
                  );
                })}
              </dl>
              <div className="mt-10 flex flex-wrap gap-3">
                <BotonExterno href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(negocio.direccion)}`}>
                  <NavigationArrowIcon size={18} weight="fill" /> Cómo llegar
                </BotonExterno>
                {negocio.whatsapp && (
                  <BotonExterno href={enlaceWhatsApp(`Hola ${negocio.nombre}, tengo una pregunta.`, negocio.whatsapp)} variante="secundario">
                    <WhatsappLogoIcon size={18} /> Escribir por WhatsApp
                  </BotonExterno>
                )}
              </div>
            </Revelar>
          </div>
          <Revelar retraso={0.1} className="lg:col-span-7">
            <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-linea bg-superficie lg:aspect-auto lg:h-full lg:min-h-[28rem]">
              <iframe
                title={`Mapa de ${negocio.nombre}`}
                src={`https://www.google.com/maps?q=${encodeURIComponent(negocio.direccion)}&output=embed`}
                className="size-full [filter:grayscale(1)_invert(0.92)_contrast(0.85)]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </Revelar>
        </div>
      </section>

      {/* Llamado final */}
      <section className="border-t border-linea">
        <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-24 text-center md:px-8 md:py-32">
          <Revelar>
            <h2 className="display mx-auto max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">Tu próxima cita está a un minuto.</h2>
            <BotonEnlace href={`${base}/reservar`} className="mt-10 px-9 py-4 text-base">
              Reservar cita
            </BotonEnlace>
          </Revelar>
        </div>
      </section>
    </>
  );
}
