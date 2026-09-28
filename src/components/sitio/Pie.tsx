import { InstagramLogoIcon } from "@phosphor-icons/react/ssr";
import Image from "next/image";
import { negocio } from "@/config/negocio";
import { Marca } from "./Marca";

export function Pie() {
  return (
    <footer className="border-t border-linea">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-3 md:px-8">
        <div className="space-y-3">
          <Marca />
          <p className="max-w-xs text-sm leading-relaxed text-tenue">{negocio.descripcion}</p>
        </div>
        <div className="space-y-2 text-sm text-tenue">
          <p className="text-texto">{negocio.direccion}</p>
          <p>{negocio.telefonoVisible}</p>
          <a href={negocio.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 transition hover:text-texto">
            <InstagramLogoIcon size={18} /> Instagram
          </a>
        </div>
        <div className="flex flex-col items-start gap-4 md:items-end">
          <a href="/admin" className="text-sm text-tenue transition hover:text-texto">
            Acceso para el equipo
          </a>
          <a href="https://github.com/noirstudio-web" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 text-xs text-tenue">
            <span>Sitio web por</span>
            <Image src="/noir-studio/logo-navbar-para-fondo-oscuro.png" alt="Noir Studio" width={96} height={28} className="opacity-70 transition group-hover:opacity-100" />
          </a>
        </div>
      </div>
      <p className="border-t border-linea px-4 py-5 text-center text-xs text-tenue">
        © {new Date().getFullYear()} {negocio.nombre}
      </p>
    </footer>
  );
}
