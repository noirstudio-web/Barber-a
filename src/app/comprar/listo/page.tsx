import { CheckCircleIcon, ClockIcon, WarningCircleIcon } from "@phosphor-icons/react/ssr";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { Marca, marcaNoir } from "@/components/sitio/Marca";
import { noir } from "@/config/noir";
import { planes } from "@/config/planes";
import { getDb } from "@/db";
import { codigos, compras } from "@/db/schema";
import { procesarPago } from "@/lib/cobros";
import { enlaceWhatsApp } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tu compra", robots: { index: false } };

// Página de regreso de Mercado Pago: confirma el pago y entrega la licencia
export default async function CompraLista({ searchParams }: PageProps<"/comprar/listo">) {
  const params = await searchParams;
  const compraId = typeof params.compra === "string" ? params.compra : "";
  const paymentId = typeof params.payment_id === "string" && params.payment_id !== "null" ? params.payment_id : null;

  if (paymentId) {
    try {
      await procesarPago(paymentId);
    } catch (e) {
      console.error("No se pudo confirmar el pago al regresar", e);
    }
  }

  const db = await getDb();
  const [fila] = compraId
    ? await db.select({ compra: compras, codigo: codigos.codigo }).from(compras).leftJoin(codigos, eq(compras.codigoId, codigos.id)).where(eq(compras.id, compraId))
    : [];
  const rechazado = params.status === "rejected" || params.collection_status === "rejected";

  return (
    <div className="mx-auto max-w-xl px-4 py-12 md:py-20">
      <Marca {...marcaNoir} />
      {fila?.codigo ? (
        <>
          <CheckCircleIcon size={48} weight="fill" className="mt-10 text-cromo" />
          <h1 className="display mt-4 text-3xl font-semibold">¡Pago aprobado, {fila.compra.nombre.split(" ")[0]}!</h1>
          <p className="mt-3 text-tenue">Esta es tu licencia del plan {planes[fila.compra.plan].nombre}. Guárdala:</p>
          <p className="display mt-4 break-all rounded-2xl bg-superficie px-6 py-5 font-mono text-3xl font-semibold tracking-widest">{fila.codigo}</p>
          <Link
            href={`/admin/registro?codigo=${encodeURIComponent(fila.codigo)}`}
            className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-cromo px-6 py-4 font-semibold text-fondo transition hover:bg-white"
          >
            Activar mi barbería ahora
          </Link>
          <p className="mt-4 text-sm text-tenue">En la activación pones el nombre de tu barbería y creas tu usuario. Tu web queda lista al instante.</p>
        </>
      ) : rechazado ? (
        <>
          <WarningCircleIcon size={48} className="mt-10 text-peligro" />
          <h1 className="display mt-4 text-3xl font-semibold">El pago no se completó</h1>
          <p className="mt-3 text-tenue">No se hizo ningún cobro. Puedes intentarlo de nuevo con otro medio de pago.</p>
          <Link href={`/comprar/${fila?.compra.plan ?? "premium"}`} className="mt-8 inline-flex rounded-full bg-cromo px-6 py-3 font-semibold text-fondo">
            Intentar de nuevo
          </Link>
        </>
      ) : (
        <>
          <ClockIcon size={48} className="mt-10 text-tenue" />
          <h1 className="display mt-4 text-3xl font-semibold">Estamos confirmando tu pago</h1>
          <p className="mt-3 text-tenue">
            Si pagaste con PSE o Efecty puede tardar unos minutos. Actualiza esta página en un momento; apenas Mercado Pago lo apruebe verás aquí tu licencia.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/comprar/listo?compra=${compraId}`} className="rounded-full bg-cromo px-6 py-3 text-sm font-semibold text-fondo">
              Actualizar
            </Link>
            <a
              href={enlaceWhatsApp(`Hola Noir Studio, hice un pago y aún no veo mi licencia. Compra ${compraId}`, noir.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-linea px-6 py-3 text-sm"
            >
              Escribir por WhatsApp
            </a>
          </div>
        </>
      )}
    </div>
  );
}
