"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const enlaces = [
  { href: "/noir", texto: "Resumen" },
  { href: "/noir/barberias", texto: "Barberías" },
  { href: "/noir/codigos", texto: "Códigos" },
  { href: "/noir/pagos", texto: "Pagos" },
  { href: "/noir/cuenta", texto: "Mi cuenta" },
];

export function EnlacesNoir({ alertas }: { alertas: number }) {
  const ruta = usePathname();
  return (
    <nav className="-mx-2 flex gap-1 overflow-x-auto [scrollbar-width:none]">
      {enlaces.map((e) => {
        const activo = e.href === "/noir" ? ruta === "/noir" : ruta.startsWith(e.href);
        return (
          <Link
            key={e.href}
            href={e.href}
            className={`flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition ${activo ? "bg-white/10 text-texto" : "text-tenue hover:text-texto"}`}
          >
            {e.texto}
            {e.href === "/noir" && alertas > 0 && (
              <span className="grid min-w-5 place-items-center rounded-full bg-peligro px-1.5 text-[11px] font-semibold text-fondo" aria-label={`${alertas} alertas`}>
                {alertas}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
