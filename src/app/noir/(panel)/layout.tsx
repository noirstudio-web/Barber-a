import { SignOutIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { Marca, marcaNoir } from "@/components/sitio/Marca";
import { exigirNoir } from "@/lib/sesion";
import { cerrarSesion } from "../../admin/acciones";

export const metadata: Metadata = { title: "Panel Noir Studio", robots: { index: false } };

const enlaces = [
  { href: "/noir", texto: "Barberías" },
  { href: "/noir/codigos", texto: "Códigos" },
  { href: "/noir/cuenta", texto: "Mi cuenta" },
];

export default async function LayoutNoir({ children }: LayoutProps<"/noir">) {
  const yo = await exigirNoir();
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-linea bg-fondo/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 md:px-8">
          <Marca {...marcaNoir} href="/noir" />
          <nav className="flex gap-1 overflow-x-auto">
            {enlaces.map((e) => (
              <Link key={e.href} href={e.href} className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm text-tenue transition hover:bg-white/5 hover:text-texto">
                {e.texto}
              </Link>
            ))}
          </nav>
          <span className="ml-auto hidden text-sm text-tenue md:inline">{yo.nombre}</span>
          <form action={cerrarSesion}>
            <button type="submit" aria-label="Salir" className="flex items-center gap-2 rounded-full px-3 py-2 text-sm text-tenue transition hover:bg-white/5 hover:text-texto">
              <SignOutIcon size={18} />
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">{children}</main>
    </div>
  );
}
