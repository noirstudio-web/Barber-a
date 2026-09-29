import { InstagramLogoIcon, WhatsappLogoIcon } from "@phosphor-icons/react/ssr";
import Image from "next/image";
import Link from "next/link";
import { Marca, type DatosMarca } from "./Marca";

export function Pie({
  marca,
  descripcion,
  direccion,
  whatsapp,
  instagram,
  conMarcaNoir = true,
}: {
  marca: DatosMarca;
  descripcion: string;
  direccion: string;
  whatsapp: string;
  instagram: string;
  conMarcaNoir?: boolean;
}) {
  return (
    <footer className="border-t border-linea">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-3 md:px-8">
        <div className="space-y-3">
          <Marca {...marca} />
          {descripcion && <p className="max-w-xs text-sm leading-relaxed text-tenue">{descripcion}</p>}
        </div>
        <div className="space-y-2 text-sm text-tenue">
          {direccion && <p className="text-texto">{direccion}</p>}
          {whatsapp && (
            <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 transition hover:text-texto">
              <WhatsappLogoIcon size={18} /> +{whatsapp}
            </a>
          )}
          {instagram && (
            <a href={instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 transition hover:text-texto">
              <InstagramLogoIcon size={18} /> Instagram
            </a>
          )}
        </div>
        <div className="flex flex-col items-start gap-4 md:items-end">
          <Link href="/admin" className="text-sm text-tenue transition hover:text-texto">
            Acceso para el equipo
          </Link>
          {conMarcaNoir && (
            <Link href="/" className="group flex items-center gap-3 text-xs text-tenue">
              <span>Sitio web por</span>
              <Image src="/noir-studio/logo-navbar-para-fondo-oscuro.png" alt="Noir Studio" width={96} height={28} className="opacity-70 transition group-hover:opacity-100" />
            </Link>
          )}
        </div>
      </div>
      <p className="border-t border-linea px-4 py-5 text-center text-xs text-tenue">
        © {new Date().getFullYear()} {marca.nombre}
      </p>
    </footer>
  );
}
