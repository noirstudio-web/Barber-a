import type { Metadata } from "next";
import Link from "next/link";
import { Marca, marcaNoir } from "@/components/sitio/Marca";
import { noir } from "@/config/noir";
import { enlaceWhatsApp } from "@/lib/whatsapp";
import { FormularioActivacion } from "./FormularioActivacion";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Activa tu barbería", robots: { index: false } };

export default async function PaginaActivacion({ searchParams }: PageProps<"/admin/registro">) {
  const { codigo } = await searchParams;
  return (
    <div className="mx-auto max-w-xl px-4 py-12 md:py-16">
      <Marca {...marcaNoir} />
      <h1 className="display mt-10 text-3xl font-semibold">Activa tu barbería</h1>
      <p className="mt-3 text-tenue">
        Escribe el código que te enviamos por WhatsApp y crea tu cuenta. Tu web queda lista al instante y la puedes editar desde el panel.
      </p>
      <FormularioActivacion codigoInicial={typeof codigo === "string" ? codigo : ""} />
      <div className="mt-10 space-y-2 border-t border-linea pt-6 text-sm text-tenue">
        <p>
          ¿Aún no tienes código?{" "}
          <a
            href={enlaceWhatsApp("Hola Noir Studio, quiero la web de reservas para mi barbería.", noir.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-texto underline underline-offset-4"
          >
            Escríbenos por WhatsApp
          </a>
        </p>
        <p>
          ¿Ya tienes cuenta?{" "}
          <Link href="/admin/login" className="text-texto underline underline-offset-4">
            Entra aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
