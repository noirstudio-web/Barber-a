import Link from "next/link";
import type { ComponentProps } from "react";

// Sistema de formas: botones en píldora, imágenes y tarjetas en rounded-2xl, campos en rounded-xl.
const estilos = {
  primario: "bg-cromo text-fondo hover:bg-white",
  secundario: "border border-linea bg-white/[0.03] text-texto hover:bg-white/[0.08]",
};

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 py-3 text-sm font-semibold transition duration-300 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

export function BotonEnlace({
  variante = "primario",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variante?: keyof typeof estilos }) {
  return <Link {...props} className={`${base} ${estilos[variante]} ${className}`} />;
}

export function Boton({
  variante = "primario",
  className = "",
  ...props
}: ComponentProps<"button"> & { variante?: keyof typeof estilos }) {
  return <button {...props} className={`${base} ${estilos[variante]} ${className}`} />;
}

export function BotonExterno({
  variante = "primario",
  className = "",
  ...props
}: ComponentProps<"a"> & { variante?: keyof typeof estilos }) {
  return <a target="_blank" rel="noopener noreferrer" {...props} className={`${base} ${estilos[variante]} ${className}`} />;
}
