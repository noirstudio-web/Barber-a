import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Marca, marcaNoir } from "@/components/sitio/Marca";
import { Navegacion } from "@/components/sitio/Navegacion";
import { Pie } from "@/components/sitio/Pie";
import { WhatsAppFlotante } from "@/components/sitio/WhatsAppFlotante";
import { barberiaPorSlug, estadoSuscripcion, limitesPlan } from "@/lib/barberias";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: LayoutProps<"/[slug]">): Promise<Metadata> {
  const b = await barberiaPorSlug((await params).slug);
  if (!b) return {};
  return {
    title: { default: b.nombre, template: `%s | ${b.nombre}` },
    description: b.descripcion || b.eslogan || `Reserva tu cita en ${b.nombre}.`,
  };
}

export default async function LayoutBarberia({ children, params }: LayoutProps<"/[slug]">) {
  const b = await barberiaPorSlug((await params).slug);
  if (!b) notFound();

  // Suscripción vencida o suspendida: la web queda en pausa, sin perder datos
  if (!estadoSuscripcion(b).activa) {
    return (
      <div className="grid min-h-dvh place-items-center px-4 text-center">
        <div className="max-w-md">
          <h1 className="display text-3xl font-semibold">{b.nombre}</h1>
          <p className="mt-4 text-tenue">Esta página no está disponible en este momento. Vuelve a intentarlo más tarde.</p>
          {b.whatsapp && (
            <a href={`https://wa.me/${b.whatsapp}`} className="mt-6 inline-block text-sm underline underline-offset-4">
              Escribir a la barbería por WhatsApp
            </a>
          )}
          <div className="mt-16 flex justify-center opacity-60">
            <Marca {...marcaNoir} />
          </div>
        </div>
      </div>
    );
  }

  const base = `/${b.slug}`;
  const marca = { nombre: b.nombre, logo: b.logo, href: base };
  return (
    <>
      <Navegacion marca={marca} base={base} conGaleria={limitesPlan(b).galeriaYResenas} />
      <main>{children}</main>
      <Pie marca={marca} descripcion={b.descripcion} direccion={b.direccion} whatsapp={b.whatsapp} instagram={b.instagram} />
      <WhatsAppFlotante numero={b.whatsapp} texto={`Hola ${b.nombre}, tengo una pregunta.`} />
    </>
  );
}
