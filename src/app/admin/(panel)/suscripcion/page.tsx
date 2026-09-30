import { CheckIcon, WhatsappLogoIcon } from "@phosphor-icons/react/ssr";
import { noir } from "@/config/noir";
import { PLANES, planes } from "@/config/planes";
import { estadoSuscripcion } from "@/lib/barberias";
import { exigirPanel } from "@/lib/sesion";
import { enlaceWhatsApp } from "@/lib/whatsapp";
import { FormularioCodigo } from "./FormularioCodigo";

export const dynamic = "force-dynamic";

export default async function PaginaSuscripcion() {
  const { usuario, barberia, comoNoir } = await exigirPanel({ permitirVencida: true });
  const estado = estadoSuscripcion(barberia);
  const plan = planes[barberia.plan];
  const vence = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Bogota" }).format(barberia.venceEn);

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-semibold">Suscripción</h1>

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
          <section className="mt-10">
            <h2 className="text-lg font-semibold">¿Tienes un código?</h2>
            <p className="mt-1 text-sm text-tenue">Escríbelo aquí para renovar o cambiar de plan.</p>
            <FormularioCodigo />
          </section>

          <section className="mt-12">
            <h2 className="text-lg font-semibold">Planes</h2>
            <p className="mt-1 text-sm text-tenue">Compra por WhatsApp y te enviamos tu código al instante.</p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {PLANES.filter((p) => p !== "prueba").map((id) => {
                const p = planes[id];
                return (
                  <div key={id} className={`flex flex-col rounded-2xl border p-6 ${id === "premium" ? "border-cromo/50 bg-superficie" : "border-linea"}`}>
                    <p className="font-semibold">{p.nombre}</p>
                    <p className="mt-2">
                      <span className="display text-4xl font-semibold">{p.precioUsd} USD</span>
                      <span className="text-tenue"> / mes</span>
                    </p>
                    <ul className="mt-5 flex-1 space-y-2 text-sm">
                      {p.incluye.map((i) => (
                        <li key={i} className="flex gap-2">
                          <CheckIcon size={16} className="mt-0.5 shrink-0" /> {i}
                        </li>
                      ))}
                    </ul>
                    <a
                      href={enlaceWhatsApp(`Hola Noir Studio, quiero el plan ${p.nombre} para mi barbería "${barberia.nombre}" (${barberia.slug}).`, noir.whatsapp)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`mt-6 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition active:scale-[0.98] ${
                        id === "premium" ? "bg-cromo text-fondo hover:bg-white" : "border border-linea hover:bg-white/10"
                      }`}
                    >
                      <WhatsappLogoIcon size={18} /> Comprar {p.nombre}
                    </a>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      ) : (
        <p className="mt-8 text-sm text-tenue">Solo el dueño de la barbería puede renovar la suscripción.</p>
      )}
    </div>
  );
}
