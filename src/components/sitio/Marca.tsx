import Image from "next/image";
import Link from "next/link";
import { negocio } from "@/config/negocio";

export function Marca({ className = "" }: { className?: string }) {
  const { nombre, subtitulo, logo } = negocio.marca;
  return (
    <Link href="/" className={`group inline-flex items-center gap-2.5 ${className}`} aria-label={`${nombre} ${subtitulo}, inicio`}>
      {logo && <Image src={logo} alt="" width={34} height={34} className="size-[34px] rounded-[9px] ring-1 ring-white/10" />}
      <span className="inline-flex items-baseline gap-2">
        <span className="display cromado text-2xl font-semibold tracking-tight">{nombre.toUpperCase()}</span>
        <span className="hidden text-[10px] font-medium uppercase tracking-[0.3em] text-tenue min-[400px]:inline">{subtitulo}</span>
      </span>
    </Link>
  );
}
