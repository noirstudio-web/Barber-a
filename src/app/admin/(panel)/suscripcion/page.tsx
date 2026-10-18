import { ArrowsClockwiseIcon, CheckIcon, CreditCardIcon, WhatsappLogoIcon } from "@phosphor-icons/react/ssr";
import { redirect } from "next/navigation";
import { noir } from "@/config/noir";
import { fmtPrecio, PLANES, planes } from "@/config/planes";
import { estadoSuscripcion } from "@/lib/barberias";
import { procesarPago, procesarSuscripcion } from "@/lib/cobros";
import { mpConfigurado } from "@/lib/mercadopago";
import { exigirPanel } from "@/lib/sesion";
import { enlaceWhatsApp } from "@/lib/whatsapp";
import { cancelarDebito, pagarPlan } from "./acciones-mp";
import { FormularioCodigo } from "./FormularioCodigo";
import { FormularioDebito } from "./FormularioDebito";

export const dynamic = "force-dynamic";

const ESTADOS_DEBITO: Record<string, string> = {
  authorized: "Activo",
  pending: "Pendiente de confirmar en Mercado Pago",
  paused: "Pausado",
  cancelled: "Cancelado",
};

const MENSAJES: Record<string, { ok: boolean; texto: string }> = {
  aprobado: { ok: true, texto: "¡Pago aprobado! Tu plan quedó renovado." },
  pendiente: { ok: true, texto: "Tu pago está en proceso. Cuando Mercado Pago lo apruebe, tu plan se renueva solo." },
  rechazado: { ok: false, texto: "El pago no se completó. Puedes intentarlo de nuevo." },
  debito: { ok: true, texto: "Débito automático registrado. Mercado Pago hará el cobro cada mes." },
  error: { ok: false, texto: "No pudimos confirmar el pago todavía. Si se aprobó, tu plan se renovará en unos minutos." },
};

// Al volver de Mercado Pago se confirma el pago en el momento (sin esperar la notificación)
// y se redirige a una dirección limpia, para mostrar los datos ya actualizados.
async function confirmarRegreso(params: Record<string, string | string[] | undefined>) {
  const paymentId = typeof params.payment_id === "string" && params.payment_id !== "null" ? params.payment_id : null;
  const preapprovalId = typeof params.preapproval_id === "string" ? params.preapproval_id : null;
  if (!paymentId && !preapprovalId) return;
  let resultado = "error";
  try {
    if (paymentId) {
      const r = await procesarPago(paymentId);
      resultado = r.estado === "aprobado" ? "aprobado" : r.estado === "pendiente" ? "pendiente" : "rechazado";
    } else if (preapprovalId) {
      await procesarSuscripcion(preapprovalId);
      resultado = "debito";
    }
  } catch (e) {
    console.error("No se pudo confirmar el regreso de Mercado Pago", e);
  }
  redirect(`/admin/suscripcion?resultado=${resultado}`);
}

export default async function PaginaSuscripcion({ searchParams }: PageProps<"/admin/suscripcion">) {
  const { usuario, barberia, comoNoir } = await exigirPanel({ permitirVencida: true });
  const params = await searchParams;
  await confirmarRegreso(params);
  const regreso = typeof params.resultado === "string" ? (MENSAJES[params.resultado] ?? null) : null;
  const estado = estadoSuscripcion(barberia);
  const plan = planes[barberia.plan];
  const vence = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Bogota" }).format(barberia.venceEn);
  const pagosEnLinea = mpConfigurado();
  const debitoActivo = barberia.mpSuscripcionEstado === "authorized" || barberia.mpSuscripcionEstado === "pending";

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-semibold">Suscripción</h1>

      {regreso && (
        <p role="status" className={`mt-6 rounded-xl px-4 py-3 text-sm ${regreso.ok ? "bg-exito/15 text-exito" : "bg-peligro/15 text-peligro"}`}>
          {regreso.texto}
        </p>
      )}

      <div className={`mt-6 rounded-2xl border p-6 ${estado.activa ? "border-linea bg-superficie" : "border-peligro/40 bg-peligro/10"}`}>
        {estado.activa ? (
          <>
            <p className="text-sm text-tenue">Plan actual</p>
            <p className="display mt-1 text-2xl font-semibold">{plan.nombre}</p>
            <p className="mt-2 text-sm">
              Activo hasta el {vence} ({estado.diasRestantes} {estado.diasRestantes === 1 ? "día" : "días"}).
            </p>
          </>
        ) : (
          <>
            <p className="display text-2xl font-semibold">
              {estado.motivo === "suspendida" ? "Tu cuenta está suspendida" : estado.motivo === "cancelada" ? "Tu plan fue cancelado" : "Tu suscripción venció"}
            </p>
            <p className="mt-2 text-sm">
              Tu web está en pausa y no recibe reservas. Tus datos, citas y clientes siguen guardados. Renueva para activarla de nuevo.
            </p>
          </>
        )}
      </div>

      {usuario.rol === "dueno" || comoNoir ? (
        <>
          <section className="mt-12">
            <h2 className="text-lg font-semibold">Planes</h2>
            <p className="mt-1 text-sm text-tenue">
              {pagosEnLinea
                ? "Paga con Mercado Pago: PSE, Nequi, tarjeta o Efecty. Al aprobarse, tu plan se renueva al instante por un mes."
                : "Compra por WhatsApp y te enviamos tu código al instante."}
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {PLANES.filter((p) => p !== "prueba").map((id) => {
                const p = planes[id];
                const destacado = id === "premium";
                const claseBoton = `mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition active:scale-[0.98] ${
                  destacado ? "bg-cromo text-fondo hover:bg-white" : "border border-linea hover:bg-white/10"
                }`;
                return (
                  <div key={id} className={`flex flex-col rounded-2xl border p-6 ${destacado ? "border-cromo/50 bg-superficie" : "border-linea"}`}>
                    <p className="font-semibold">{p.nombre}</p>
                    <p className="mt-2">
                      <span className="display text-4xl font-semibold">{fmtPrecio(p.precio)}</span>
                      <span className="text-tenue"> / mes</span>
                    </p>
                    <ul className="mt-5 flex-1 space-y-2 text-sm">
                      {p.incluye.map((i) => (
                        <li key={i} className="flex gap-2">
                          <CheckIcon size={16} className="mt-0.5 shrink-0" /> {i}
                        </li>
                      ))}
                    </ul>
                    {pagosEnLinea ? (
                      <form action={pagarPlan.bind(null, id)}>
                        <button type="submit" className={claseBoton}>
                          <CreditCardIcon size={18} /> Pagar {p.nombre} con Mercado Pago
                        </button>
                      </form>
                    ) : (
                      <a
                        href={enlaceWhatsApp(`Hola Noir Studio, quiero el plan ${p.nombre} para mi barbería "${barberia.nombre}" (${barberia.slug}).`, noir.whatsapp)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={claseBoton}
                      >
                        <WhatsappLogoIcon size={18} /> Comprar {p.nombre}
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {pagosEnLinea && (
            <section className="mt-12">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <ArrowsClockwiseIcon size={20} /> Débito automático
              </h2>
              {debitoActivo ? (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-linea p-5 text-sm">
                  <div>
                    <p className="font-semibold">
                      Plan {planes[barberia.mpSuscripcionPlan ?? barberia.plan].nombre}:{" "}
                      {fmtPrecio(planes[barberia.mpSuscripcionPlan ?? barberia.plan].precio)} cada mes
                    </p>
                    <p className="mt-1 text-tenue">Estado: {ESTADOS_DEBITO[barberia.mpSuscripcionEstado ?? ""] ?? barberia.mpSuscripcionEstado}</p>
                  </div>
                  <form action={cancelarDebito}>
                    <button type="submit" className="rounded-full px-4 py-2 text-sm text-peligro transition hover:bg-peligro/15">
                      Cancelar débito automático
                    </button>
                  </form>
                </div>
              ) : (
                <>
                  <p className="mt-1 text-sm text-tenue">
                    Inscribe tu tarjeta una vez y Mercado Pago cobra tu plan cada mes. Tu web nunca se pausa por olvido. Puedes cancelarlo cuando quieras.
                  </p>
                  <FormularioDebito planActual={barberia.plan === "basico" ? "basico" : "premium"} />
                </>
              )}
            </section>
          )}

          <section className="mt-12">
            <h2 className="text-lg font-semibold">¿Tienes un código?</h2>
            <p className="mt-1 text-sm text-tenue">Si compraste por WhatsApp, escribe aquí tu código para renovar o cambiar de plan.</p>
            <FormularioCodigo />
          </section>
        </>
      ) : (
        <p className="mt-8 text-sm text-tenue">Solo el dueño de la barbería puede renovar la suscripción.</p>
      )}
    </div>
  );
}
