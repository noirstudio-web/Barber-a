import Link from "next/link";
import { negocio } from "@/config/negocio";

export function Marca({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`group inline-flex items-baseline gap-2 ${className}`} aria-label={`${negocio.nombre}, inicio`}>
      <span className="display cromado text-2xl font-semibold tracking-tight">{negocio.nombreCorto.toUpperCase()}</span>
      <span className="hidden text-[10px] font-medium uppercase tracking-[0.3em] text-tenue min-[400px]:inline">Barber Club</span>
    </Link>
  );
}
