import { ArrowLeftIcon, WhatsappLogoIcon } from "@phosphor-icons/react/ssr";
import { and, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { barberos, citas, clientes, servicios } from "@/db/schema";
import { exigirPanel } from "@/lib/sesion";
import { fmtFecha, fmtHora, fmtPrecio } from "@/lib/tiempo";
import { numeroInternacional } from "@/lib/whatsapp";
import { ESTILO_ESTADO } from "../../estados";

export const dynamic = "force-dynamic";

export default async function PaginaCliente({ params }: PageProps<"/admin/clientes/[id]">) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const { barberia } = await exigirPanel();
  const db = await getDb();
  const [cliente] = await db.select().from(clientes).where(and(eq(clientes.id, id), eq(clientes.barberiaId, barberia.id)));
  if (!cliente) notFound();

  const historial = await db
    .select({
      id: citas.id,
      fecha: citas.fecha,
      inicioMin: citas.inicioMin,
      estado: citas.estado,
      precio: citas.precio,
      servicio: servicios.nombre,
      barbero: barberos.nombre,
    })
    .from(citas)
    .innerJoin(servicios, eq(citas.servicioId, servicios.id))
    .innerJoin(barberos, eq(citas.barberoId, barberos.id))
    .where(eq(citas.clienteId, id))
    .orderBy(desc(citas.fecha), desc(citas.inicioMin));

  const completadas = historial.filter((c) => c.estado === "completada");
  const favorito = Object.entries(
    completadas.reduce<Record<string, number>>((m, c) => ({ ...m, [c.barbero]: (m[c.barbero] ?? 0) + 1 }), {}),
  ).sort((a, b) => b[1] - a[1])[0]?.[0];
  const tel = numeroInternacional(cliente.telefono);

  return (
    <div className="max-w-3xl">
      <Link href="/admin/clientes" className="inline-flex items-center gap-2 text-sm text-tenue hover:text-texto">
        <ArrowLeftIcon size={16} /> Clientes
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{cliente.nombre}</h1>
          <p className="mt-1 tabular-nums text-tenue">{cliente.telefono}</p>
        </div>
        <a
          href={`https://wa.me/${tel}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-linea px-4 py-2 text-sm hover:bg-white/5"
        >
          <WhatsappLogoIcon size={18} /> Escribir
        </a>
      </div>

      <dl className="mt-8 grid grid-cols-3 gap-3">
        {[
          { t: "Visitas", v: String(completadas.length) },
          { t: "Total gastado", v: fmtPrecio(completadas.reduce((s, c) => s + c.precio, 0)) },
          { t: "Barbero habitual", v: favorito ?? "-" },
        ].map((d) => (
          <div key={d.t} className="rounded-2xl bg-superficie p-4">
            <dt className="text-xs text-tenue">{d.t}</dt>
            <dd className="mt-1 truncate font-semibold tabular-nums">{d.v}</dd>
          </div>
        ))}
      </dl>

      <h2 className="mt-10 text-lg font-semibold">Historial</h2>
      <ul className="mt-4 space-y-2">
        {historial.map((c) => (
          <li key={c.id} className={`flex items-center justify-between gap-4 border-l-2 bg-superficie px-4 py-3 text-sm ${ESTILO_ESTADO[c.estado].borde}`}>
            <div>
              <p className="font-semibold first-letter:uppercase">
                {fmtFecha(c.fecha, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}, {fmtHora(c.inicioMin)}
              </p>
              <p className="text-tenue">
                {c.servicio} con {c.barbero}
              </p>
            </div>
            <div className="text-right">
              <p className="tabular-nums">{fmtPrecio(c.precio)}</p>
              <p className="text-xs text-tenue">{ESTILO_ESTADO[c.estado].etiqueta}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
