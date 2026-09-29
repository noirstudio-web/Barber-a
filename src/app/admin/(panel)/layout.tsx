import { SignOutIcon, UserCircleIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import type { Metadata } from "next";
import { Marca } from "@/components/sitio/Marca";
import { exigirAdmin } from "@/lib/sesion";
import { cerrarSesion } from "../acciones";
import { EnlacesPanel } from "./EnlacesPanel";

export const metadata: Metadata = { title: "Panel", robots: { index: false } };

export default async function LayoutPanel({ children }: LayoutProps<"/admin">) {
  const yo = await exigirAdmin();
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-linea bg-fondo/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 md:px-8">
          <Marca />
          <EnlacesPanel />
          <Link
            href="/admin/cuenta"
            className="ml-auto flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm text-tenue transition hover:bg-white/5 hover:text-texto"
          >
            <UserCircleIcon size={20} /> <span className="hidden md:inline">{yo.nombre.split(" ")[0]}</span>
          </Link>
          <form action={cerrarSesion}>
            <button type="submit" className="flex items-center gap-2 rounded-full px-3 py-2 text-sm text-tenue transition hover:bg-white/5 hover:text-texto">
              <SignOutIcon size={18} /> <span className="hidden sm:inline">Salir</span>
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">{children}</main>
    </div>
  );
}
