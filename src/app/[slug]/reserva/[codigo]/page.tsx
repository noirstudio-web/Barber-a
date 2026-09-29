import { CalendarPlusIcon, CheckCircleIcon, ProhibitIcon, WhatsappLogoIcon } from "@phosphor-icons/react/ssr";
import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BotonEnlace, BotonExterno } from "@/components/sitio/Boton";
import { region } from "@/config/region";
import { getDb } from "@/db";
import { barberias, barberos, citas, clientes, servicios } from "@/db/schema";
import { ahoraLocal, fmtFecha, fmtHora, fmtPrecio, minutosAHora } from "@/lib/tiempo";
import { enlaceWhatsApp, textoAvisoCita } from "@/lib/whatsapp";
import { CancelarCita } from "./CancelarCita";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tu cita", robots: { index: false } };

export default async function PaginaCita({ params }: PageProps<"/[slug]/reserva/[codigo]">) {
  const { codigo, slug } = await params;
  const db = await getDb();
  const [fila] = await db
    .select({ cita: citas, cliente: clientes, barbero: barberos, servicio: servicios, negocio: barberias })
    .from(citas)
    .innerJoin(clientes, eq(citas.clienteId, clientes.id))
    .innerJoin(barberos, eq(citas.barberoId, barberos.id))
    .innerJoin(servicios, eq(citas.servicioId, servicios.id))
    .innerJoin(barberias, eq(citas.barberiaId, barberias.id))
    .where(and(eq(citas.codigo, codigo.toUpperCase()), eq(barberias.slug, slug)));
  if (!fila) notFound();

  const { cita, cliente, barbero, servicio, negocio } = fila;
  const fecha = fmtFecha(cita.fecha);
  const hora = fmtHora(cita.inicioMin);
  const cancelada = cita.estado === "cancelada";
  const ahora = ahoraLocal();
  const futura = cita.fecha > ahora.fecha || (cita.fecha === ahora.fecha && cita.inicioMin > ahora.minutos);

  const aviso = textoAvisoCita({
    negocio: { nombre: negocio.nombre, direccion: negocio.direccion, whatsapp: negocio.whatsapp },
    codigo: cita.codigo,
    cliente: cliente.nombre,
    telefono: cliente.telefono,
    servicio: servicio.nombre,
    barbero: barbero.nombre,
    fecha,
    hora,
  });
  const f = cita.fecha.replaceAll("-", "");
  const calendario =
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    `&text=${encodeURIComponent(`${servicio.nombre} en ${negocio.nombre}`)}` +
    `&dates=${f}T${minutosAHora(cita.inicioMin).replace(":", "")}00/${f}T${minutosAHora(cita.finMin).replace(":", "")}00` +
    `&ctz=${encodeURIComponent(region.zonaHoraria)}` +
    `&details=${encodeURIComponent(`Con ${barbero.nombre}. Código ${cita.codigo}.`)}` +
    `&location=${encodeURIComponent(negocio.direccion)}`;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-12 md:pt-20">
      {cancelada ? (
        <ProhibitIcon size={48} className="text-tenue" />
      ) : (
        <CheckCircleIcon size={48} weight="fill" className="text-cromo" />
      )}
      <h1 className="display mt-6 text-3xl font-semibold md:text-4xl">
        {cancelada ? "Cita cancelada" : `Listo, ${cliente.nombre.split(" ")[0]}. Tu cita está confirmada.`}
      </h1>
      {!cancelada && <p className="mt-3 text-tenue">Guarda este enlace para ver o cancelar tu cita.</p>}

      <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-6 rounded-2xl bg-superficie p-6 sm:p-8">
        <div className="col-span-2">
          <dt className="text-sm text-tenue">Fecha y hora</dt>
          <dd className="display mt-1 text-2xl font-semibold first-letter:uppercase">
            {fecha}, {hora}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-tenue">Servicio</dt>
          <dd className="mt-1">{servicio.nombre}</dd>
        </div>
        <div>
          <dt className="text-sm text-tenue">Barbero</dt>
          <dd className="mt-1">{barbero.nombre}</dd>
        </div>
        <div>
          <dt className="text-sm text-tenue">Total en el local</dt>
          <dd className="mt-1 tabular-nums">{fmtPrecio(cita.precio)}</dd>
        </div>
        <div>
          <dt className="text-sm text-tenue">Código</dt>
          <dd className="mt-1 font-mono tracking-widest">{cita.codigo}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-sm text-tenue">Dirección</dt>
          <dd className="mt-1">{negocio.direccion}</dd>
        </div>
      </dl>

      {!cancelada && futura && (
        <div className="mt-8 flex flex-wrap gap-3">
          <BotonExterno href={enlaceWhatsApp(aviso, negocio.whatsapp)}>
            <WhatsappLogoIcon size={18} weight="fill" /> Enviar a la barbería
          </BotonExterno>
          <BotonExterno href={calendario} variante="secundario">
            <CalendarPlusIcon size={18} /> Agregar a mi calendario
          </BotonExterno>
        </div>
      )}

      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-linea pt-6">
        <BotonEnlace href={`/${negocio.slug}`} variante="secundario">
          Volver al inicio
        </BotonEnlace>
        {!cancelada && futura && <CancelarCita codigo={cita.codigo} />}
      </div>
    </div>
  );
}
