import { SignOutIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import { Marca, marcaNoir } from "@/components/sitio/Marca";
import { exigirNoir } from "@/lib/sesion";
import { listarBarberias } from "@/lib/noir";
import { cerrarSesion } from "../../admin/acciones";
import { EnlacesNoir } from "./EnlacesNoir";

export const metadata: Metadata = { title: "Panel Noir Studio", robots: { index: false } };

export default async function LayoutNoir({ children }: LayoutProps<"/noir">) {
  const yo = await exigirNoir();
  // Barberías que necesitan atención: vencen pronto o ya vencieron (sin contar canceladas ni la demo)
  const alertas = (await listarBarberias()).filter((f) => !f.esDemo && (f.porVencer || f.estado.motivo === "vencida")).length;

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-linea bg-fondo/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:px-8">
          <Marca {...marcaNoir} href="/noir" />
          <span className="hidden rounded-full border border-linea px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-tenue sm:inline">Administrador</span>
          <span className="ml-auto hidden text-sm text-tenue md:inline">{yo.nombre}</span>
          <form action={cerrarSesion} className="ml-auto md:ml-0">
            <button type="submit" aria-label="Salir" className="flex items-center gap-2 rounded-full px-3 py-2 text-sm text-tenue transition hover:bg-white/5 hover:text-texto">
              <SignOutIcon size={18} /> <span className="hidden sm:inline">Salir</span>
            </button>
          </form>
        </div>
        <div className="mx-auto max-w-7xl px-4 pb-2 md:px-8">
          <EnlacesNoir alertas={alertas} />
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">{children}</main>
    </div>
  );
}
