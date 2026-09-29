import { ArrowUpRightIcon, BellRingingIcon, CalendarCheckIcon, CheckIcon, PencilSimpleIcon, UsersThreeIcon, WhatsappLogoIcon } from "@phosphor-icons/react/ssr";
import Image from "next/image";
import Link from "next/link";
import { BotonEnlace, BotonExterno } from "@/components/sitio/Boton";
import { Marca, marcaNoir } from "@/components/sitio/Marca";
import { Revelar } from "@/components/sitio/Revelar";
import { noir } from "@/config/noir";
import { PLANES, planes } from "@/config/planes";
import { enlaceWhatsApp } from "@/lib/whatsapp";

const mensajePlan = (plan: string) => `Hola Noir Studio, quiero el plan ${plan} de la web con reservas para mi barbería.`;

const pasos = [
  { titulo: "Nos escribes por WhatsApp", texto: "Eliges tu plan y te enviamos tu código de activación." },
  { titulo: "Activas tu barbería", texto: "Pones el código, el nombre de tu barbería y creas tu usuario. En un minuto tu web está en línea." },
  { titulo: "Tus clientes reservan solos", texto: "Comparte tu enlace en Instagram y WhatsApp. Las citas caen directo a tu agenda." },
];

export default function InicioNoir() {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-linea bg-fondo/80 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
          <Marca {...marcaNoir} />
          <ul className="hidden items-center gap-8 text-sm text-tenue md:flex">
            <li>
              <a href="#como-funciona" className="transition hover:text-texto">
                Cómo funciona
              </a>
            </li>
            <li>
              <a href="#planes" className="transition hover:text-texto">
                Planes
              </a>
            </li>
            <li>
              <Link href={`/${noir.demo}`} className="transition hover:text-texto">
                Demo
              </Link>
            </li>
          </ul>
          <BotonEnlace href="/admin/login" variante="secundario" className="px-5 py-2.5">
            Entrar
          </BotonEnlace>
        </nav>
      </header>

      <main>
        {/* Portada */}
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 md:px-8 lg:grid-cols-12 lg:py-20">
          <div className="lg:col-span-5">
            <Revelar>
              <h1 className="display text-5xl font-semibold leading-[1.02] md:text-6xl">
                Tu barbería con reservas <em className="cromado not-italic">online.</em>
              </h1>
            </Revelar>
            <Revelar retraso={0.08}>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-tenue">
                Web propia donde tus clientes eligen servicio, barbero y hora. Tú recibes la cita por WhatsApp.
              </p>
            </Revelar>
            <Revelar retraso={0.16}>
              <div className="mt-9 flex flex-wrap gap-3">
                <BotonExterno href={enlaceWhatsApp(mensajePlan("Prueba gratis de 7 días"), noir.whatsapp)} className="px-7 py-4 text-base">
                  <WhatsappLogoIcon size={20} weight="fill" /> Probar 7 días gratis
                </BotonExterno>
                <BotonEnlace href={`/${noir.demo}`} variante="secundario" className="px-7 py-4 text-base">
                  Ver demo
                </BotonEnlace>
              </div>
            </Revelar>
          </div>
          <Revelar retraso={0.1} className="lg:col-span-7">
            <div className="relative pb-6">
              <div className="overflow-hidden rounded-2xl border border-linea shadow-2xl shadow-black/60">
                <Image src="/noir-studio/captura-web.png" alt="Web de una barbería con el botón Reservar cita" width={1440} height={900} priority sizes="(min-width: 1024px) 55vw, 100vw" className="h-auto w-full" />
              </div>
              <div className="absolute -bottom-10 -left-4 hidden w-[23%] overflow-hidden rounded-[1.4rem] border-4 border-superficie-2 shadow-2xl shadow-black/70 sm:block md:-left-10">
                <Image src="/noir-studio/captura-movil.png" alt="Reserva desde el celular: calendario con horas libres" width={390} height={844} sizes="25vw" className="h-auto w-full" />
              </div>
            </div>
          </Revelar>
        </section>

        {/* Cómo funciona */}
        <section id="como-funciona" className="scroll-mt-16 border-t border-linea">
          <div className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
            <Revelar>
              <h2 className="display max-w-2xl text-4xl font-semibold leading-tight md:text-5xl">Lista el mismo día.</h2>
            </Revelar>
            <ol className="mt-14 grid gap-10 md:grid-cols-3">
              {pasos.map((p, i) => (
                <Revelar key={p.titulo} retraso={i * 0.08}>
                  <li className="border-l border-cromo/40 pl-5">
                    <span className="display cromado text-4xl font-semibold">{i + 1}</span>
                    <h3 className="mt-3 text-lg font-semibold">{p.titulo}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-tenue">{p.texto}</p>
                  </li>
                </Revelar>
              ))}
            </ol>
          </div>
        </section>

        {/* Lo que incluye */}
        <section className="border-t border-linea">
          <div className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
            <Revelar>
              <h2 className="display max-w-2xl text-4xl font-semibold leading-tight md:text-5xl">Todo lo que tu barbería necesita.</h2>
            </Revelar>
            <div className="mt-14 grid gap-4 lg:grid-cols-12">
              <Revelar className="lg:col-span-7">
                <div className="h-full overflow-hidden rounded-2xl bg-superficie">
                  <div className="p-7">
                    <CalendarCheckIcon size={28} />
                    <h3 className="mt-4 text-xl font-semibold">Panel con tu agenda</h3>
                    <p className="mt-2 max-w-md text-sm leading-relaxed text-tenue">Citas del día y de la semana por barbero, clientes con historial, bloqueos para almuerzos y días libres.</p>
                  </div>
                  <Image src="/noir-studio/captura-panel.png" alt="Agenda del panel con las citas de cada barbero" width={1440} height={900} sizes="(min-width: 1024px) 55vw, 100vw" className="h-auto w-full border-t border-linea" />
                </div>
              </Revelar>
              <div className="grid gap-4 lg:col-span-5">
                {[
                  { icono: PencilSimpleIcon, titulo: "Editas todo tú", texto: "Nombre, logo, fotos, precios, servicios, barberos y horario, desde el celular." },
                  { icono: BellRingingIcon, titulo: "Recordatorios por WhatsApp", texto: "Aviso de cada cita nueva y recordatorio 2 horas antes al cliente y al barbero." },
                  { icono: UsersThreeIcon, titulo: "Tu equipo con su usuario", texto: "Cada barbero entra con su propia cuenta y contraseña." },
                ].map((f, i) => (
                  <Revelar key={f.titulo} retraso={i * 0.08}>
                    <div className="h-full rounded-2xl border border-linea p-7">
                      <f.icono size={26} />
                      <h3 className="mt-4 text-lg font-semibold">{f.titulo}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-tenue">{f.texto}</p>
                    </div>
                  </Revelar>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Planes */}
        <section id="planes" className="scroll-mt-16 border-t border-linea">
          <div className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
            <Revelar>
              <h2 className="display text-4xl font-semibold leading-tight md:text-5xl">Planes</h2>
              <p className="mt-4 max-w-[60ch] text-tenue">Pagas mes a mes. Sin contratos ni permanencia.</p>
            </Revelar>
            <div className="mt-12 grid items-stretch gap-4 lg:grid-cols-3">
              {PLANES.map((id, i) => {
                const p = planes[id];
                const destacado = id === "premium";
                return (
                  <Revelar key={id} retraso={i * 0.08}>
                    <div className={`flex h-full flex-col rounded-2xl p-7 ${destacado ? "bg-cromo text-fondo" : "border border-linea"}`}>
                      <p className="font-semibold">{p.nombre}</p>
                      <p className="mt-3">
                        <span className="display text-5xl font-semibold">{p.precioUsd === 0 ? "Gratis" : `${p.precioUsd} USD`}</span>
                        <span className={destacado ? "text-fondo/60" : "text-tenue"}>{p.precioUsd === 0 ? ` / ${p.dias} días` : " / mes"}</span>
                      </p>
                      <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                        {p.incluye.map((x) => (
                          <li key={x} className="flex gap-2">
                            <CheckIcon size={16} weight="bold" className="mt-0.5 shrink-0" /> {x}
                          </li>
                        ))}
                      </ul>
                      <a
                        href={enlaceWhatsApp(mensajePlan(p.nombre), noir.whatsapp)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`mt-8 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold transition active:scale-[0.98] ${
                          destacado ? "bg-fondo text-texto hover:bg-superficie-2" : "border border-linea hover:bg-white/10"
                        }`}
                      >
                        <WhatsappLogoIcon size={18} /> {p.precioUsd === 0 ? "Pedir prueba" : `Comprar ${p.nombre}`}
                      </a>
                    </div>
                  </Revelar>
                );
              })}
            </div>
            <p className="mt-8 text-sm text-tenue">
              ¿Ya tienes tu código?{" "}
              <Link href="/admin/registro" className="text-texto underline underline-offset-4">
                Activa tu barbería
              </Link>
            </p>
          </div>
        </section>

        {/* Demo */}
        <section className="border-t border-linea">
          <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-24 text-center md:px-8 md:py-32">
            <Revelar>
              <h2 className="display mx-auto max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">Mira cómo se vería la tuya.</h2>
              <BotonEnlace href={`/${noir.demo}`} className="mt-10 px-9 py-4 text-base">
                Ver demo <ArrowUpRightIcon size={18} />
              </BotonEnlace>
            </Revelar>
          </div>
        </section>
      </main>

      <footer className="border-t border-linea">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-tenue md:px-8">
          <Marca {...marcaNoir} />
          <p>© {new Date().getFullYear()} Noir Studio</p>
        </div>
      </footer>
    </>
  );
}
