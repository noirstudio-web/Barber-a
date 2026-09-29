import Image from "next/image";
import Link from "next/link";

export type DatosMarca = { nombre: string; logo: string | null; subtitulo?: string; href: string };

// Logo + nombre. Sirve para cada barbería y para Noir Studio.
export function Marca({ nombre, logo, subtitulo, href, className = "" }: DatosMarca & { className?: string }) {
  return (
    <Link href={href} className={`group inline-flex min-w-0 items-center gap-2.5 ${className}`} aria-label={`${nombre}${subtitulo ? ` ${subtitulo}` : ""}, inicio`}>
      {logo && (
        <Image src={logo} alt="" width={34} height={34} className="size-[34px] shrink-0 rounded-[9px] object-cover ring-1 ring-white/10" />
      )}
      <span className="inline-flex min-w-0 items-baseline gap-2">
        <span className="display cromado truncate text-xl font-semibold tracking-tight sm:text-2xl">{nombre}</span>
        {subtitulo && (
          <span className="hidden text-[10px] font-medium uppercase tracking-[0.3em] text-tenue min-[400px]:inline">{subtitulo}</span>
        )}
      </span>
    </Link>
  );
}

export const marcaNoir: DatosMarca = { nombre: "NOIR", subtitulo: "Studio", logo: "/noir-studio/noir-app-icon.png", href: "/" };
