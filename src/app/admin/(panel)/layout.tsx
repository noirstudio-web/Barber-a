import { ArrowSquareOutIcon, SignOutIcon, UserCircleIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { Marca } from "@/components/sitio/Marca";
import { planes } from "@/config/planes";
import { estadoSuscripcion, limitesPlan } from "@/lib/barberias";
import { exigirPanel } from "@/lib/sesion";
import { salirDePanelBarberia } from "../../noir/acciones";
import { cerrarSesion } from "../acciones";
import { EnlacesPanel } from "./EnlacesPanel";

export const metadata: Metadata = { title: "Panel", robots: { index: false } };

export default async function LayoutPanel({ children }: LayoutProps<"/admin">) {
  const { usuario, barberia, comoNoir } = await exigirPanel({ permitirVencida: true });
  const esDueno = usuario.rol === "dueno" || comoNoir;
  const estado = estadoSuscripcion(barberia);
  const aviso =
    !estado.activa
      ? null
      : barberia.plan === "prueba"
        ? `Estás en la prueba gratis: te quedan ${estado.diasRestantes} ${estado.diasRestantes === 1 ? "día" : "días"}.`
        : estado.diasRestantes <= 5
          ? `Tu plan ${planes[barberia.plan].nombre} vence en ${estado.diasRestantes} ${estado.diasRestantes === 1 ? "día" : "días"}.`
          : null;

  return (
    <div className="min-h-dvh">
      {comoNoir && (
        <div className="bg-cromo text-fondo">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm md:px-8">
            <span>
              Estás en el panel de <strong>{barberia.nombre}</strong> como Noir Studio. Los cambios que hagas se guardan en su barbería.
            </span>
            <form action={salirDePanelBarberia.bind(null, barberia.id)}>
              <button type="submit" className="rounded-full bg-fondo px-4 py-1.5 text-xs font-semibold text-texto transition hover:bg-superficie-2">
                Volver a mi panel
              </button>
            </form>
          </div>
        </div>
      )}
      <header className="sticky top-0 z-40 border-b border-linea bg-fondo/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:px-8">
          <Marca nombre={barberia.nombre} logo={barberia.logo} href="/admin" className="max-w-[45vw] lg:max-w-60" />
          <a
            href={`/${barberia.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Ver mi web"
            className="hidden shrink-0 items-center gap-1.5 rounded-full border border-linea px-3 py-1.5 text-xs text-tenue transition hover:text-texto sm:flex"
          >
            <ArrowSquareOutIcon size={14} /> Ver mi web
          </a>
          <Link
            href="/admin/cuenta"
            className="ml-auto flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm text-tenue transition hover:bg-white/5 hover:text-texto"
          >
            <UserCircleIcon size={20} /> <span className="hidden md:inline">{usuario.nombre.split(" ")[0]}</span>
          </Link>
          <form action={cerrarSesion}>
            <button type="submit" aria-label="Salir" className="flex items-center gap-2 rounded-full px-3 py-2 text-sm text-tenue transition hover:bg-white/5 hover:text-texto">
              <SignOutIcon size={18} /> <span className="hidden sm:inline">Salir</span>
            </button>
          </form>
        </div>
        <div className="mx-auto max-w-7xl px-4 pb-2 md:px-8">
          <EnlacesPanel esDueno={esDueno} conExtras={limitesPlan(barberia).galeriaYResenas} premium={limitesPlan(barberia).herramientasPremium} />
        </div>
      </header>
      {aviso && (
        <div className="border-b border-linea bg-superficie">
          <p className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm md:px-8">
            {aviso}
            {esDueno && (
              <Link href="/admin/suscripcion" className="font-semibold underline underline-offset-4">
                Ver planes
              </Link>
            )}
          </p>
        </div>
      )}
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">{children}</main>
    </div>
  );
}
