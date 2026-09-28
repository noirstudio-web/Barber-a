"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const enlaces = [
  { href: "/admin", texto: "Agenda" },
  { href: "/admin/bloqueos", texto: "Bloqueos" },
  { href: "/admin/servicios", texto: "Servicios" },
  { href: "/admin/clientes", texto: "Clientes" },
];

export function EnlacesPanel() {
  const ruta = usePathname();
  return (
    <nav className="-mx-2 flex gap-1 overflow-x-auto">
      {enlaces.map((e) => {
        const activo = e.href === "/admin" ? ruta === "/admin" : ruta.startsWith(e.href);
        return (
          <Link
            key={e.href}
            href={e.href}
            className={`whitespace-nowrap rounded-full px-3 py-2 text-sm transition ${activo ? "bg-white/10 text-texto" : "text-tenue hover:text-texto"}`}
          >
            {e.texto}
          </Link>
        );
      })}
    </nav>
  );
}
