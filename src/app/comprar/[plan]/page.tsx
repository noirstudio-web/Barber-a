import { CheckIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Marca, marcaNoir } from "@/components/sitio/Marca";
import { noir } from "@/config/noir";
import { fmtPrecio, planes } from "@/config/planes";
import { mpConfigurado } from "@/lib/mercadopago";
import { enlaceWhatsApp } from "@/lib/whatsapp";
import { FormularioCompra } from "./FormularioCompra";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Comprar plan" };

export default async function PaginaComprar({ params }: PageProps<"/comprar/[plan]">) {
  const { plan } = await params;
  if (plan !== "basico" && plan !== "premium") notFound();
  const p = planes[plan];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-8 md:py-16">
      <Marca {...marcaNoir} />
      <div className="mt-10 grid gap-10 lg:grid-cols-12">
        <section className="lg:col-span-5">
          <p className="text-sm text-tenue">Estás comprando</p>
          <h1 className="display mt-1 text-4xl font-semibold">Plan {p.nombre}</h1>
          <p className="mt-3">
            <span className="display text-3xl font-semibold">{fmtPrecio(p.precio)}</span>
            <span className="text-tenue"> / mes</span>
          </p>
          <ul className="mt-6 space-y-2 text-sm">
            {p.incluye.map((x) => (
              <li key={x} className="flex gap-2">
                <CheckIcon size={16} className="mt-0.5 shrink-0" /> {x}
              </li>
            ))}
          </ul>
          <Link href={`/comprar/${plan === "basico" ? "premium" : "basico"}`} className="mt-6 inline-block text-sm text-tenue underline underline-offset-4 hover:text-texto">
            Ver el plan {plan === "basico" ? "Premium" : "Básico"}
          </Link>
        </section>

        <section className="lg:col-span-7">
          {mpConfigurado() ? (
            <>
              <h2 className="text-lg font-semibold">Tus datos</h2>
              <p className="mt-1 text-sm text-tenue">
                Pagas en Mercado Pago con PSE, Nequi, tarjeta o Efecty. Al aprobarse el pago recibes tu licencia y activas tu barbería en un minuto.
              </p>
              <FormularioCompra plan={plan} />
            </>
          ) : (
            <div className="rounded-2xl border border-linea p-6">
              <p className="font-semibold">Compra por WhatsApp</p>
              <p className="mt-1 text-sm text-tenue">Escríbenos y te enviamos tu licencia en minutos.</p>
              <a
                href={enlaceWhatsApp(`Hola Noir Studio, quiero el plan ${p.nombre} de la web con reservas para mi barbería.`, noir.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex rounded-full bg-cromo px-6 py-3 text-sm font-semibold text-fondo"
              >
                Escribir por WhatsApp
              </a>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
