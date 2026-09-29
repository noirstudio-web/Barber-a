import type { Metadata } from "next";
import { Reservador } from "@/components/reserva/Reservador";
import { notFound } from "next/navigation";
import { barberiaPorSlug } from "@/lib/barberias";
import { barberosActivos, serviciosActivos } from "@/lib/datos";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reservar cita",
  description: "Elige servicio, barbero y hora. Confirmación inmediata.",
};

export default async function PaginaReservar({ params: p, searchParams }: PageProps<"/[slug]/reservar">) {
  const negocio = await barberiaPorSlug((await p).slug);
  if (!negocio) notFound();
  const [servicios, barberos, params] = await Promise.all([serviciosActivos(negocio.id), barberosActivos(negocio.id), searchParams]);
  const servicioInicial = servicios.find((s) => String(s.id) === params.servicio)?.id ?? null;
  const barberoInicial = barberos.find((b) => String(b.id) === params.barbero)?.id ?? null;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-10 md:px-8 md:pt-14">
      <h1 className="display text-3xl font-semibold md:text-4xl">Reserva tu cita</h1>
      <Reservador
        servicios={servicios.map(({ id, nombre, descripcion, duracionMin, precio }) => ({ id, nombre, descripcion, duracionMin, precio }))}
        barberos={barberos.map(({ id, nombre, especialidad, foto }) => ({ id, nombre, especialidad, foto }))}
        slug={negocio.slug}
        servicioInicial={servicioInicial}
        barberoInicial={barberoInicial}
      />
    </div>
  );
}
