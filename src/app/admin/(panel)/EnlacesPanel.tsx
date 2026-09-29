"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function EnlacesPanel({ esDueno, conExtras }: { esDueno: boolean; conExtras: boolean }) {
  const ruta = usePathname();
  const enlaces = [
    { href: "/admin", texto: "Agenda" },
    { href: "/admin/bloqueos", texto: "Bloqueos" },
    { href: "/admin/clientes", texto: "Clientes" },
    { href: "/admin/servicios", texto: "Servicios" },
    { href: "/admin/barberos", texto: "Barberos" },
    ...(conExtras ? [{ href: "/admin/galeria", texto: "Galería y reseñas" }] : []),
    ...(esDueno
      ? [
          { href: "/admin/barberia", texto: "Mi barbería" },
          { href: "/admin/suscripcion", texto: "Suscripción" },
        ]
      : []),
  ];
  return (
    <nav className="-mx-2 flex gap-1 overflow-x-auto [scrollbar-width:none]">
      {enlaces.map((e) => {
        const activo = e.href === "/admin" ? ruta === "/admin" : ruta.startsWith(e.href);
        return (
          <Link
            key={e.href}
            href={e.href}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition ${activo ? "bg-white/10 text-texto" : "text-tenue hover:text-texto"}`}
          >
            {e.texto}
          </Link>
        );
      })}
    </nav>
  );
}
