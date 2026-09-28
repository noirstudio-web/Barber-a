import { negocio } from "@/config/negocio";

export function enlaceWhatsApp(texto?: string, numero: string = negocio.whatsapp): string {
  return `https://wa.me/${numero}${texto ? `?text=${encodeURIComponent(texto)}` : ""}`;
}

export type AvisoCita = {
  codigo: string;
  cliente: string;
  telefono: string;
  servicio: string;
  barbero: string;
  fecha: string;
  hora: string;
};

export function textoAvisoCita(a: AvisoCita): string {
  return [
    `Nueva cita en ${negocio.nombre}`,
    `Cliente: ${a.cliente} (${a.telefono})`,
    `Servicio: ${a.servicio}`,
    `Barbero: ${a.barbero}`,
    `Fecha: ${a.fecha}, ${a.hora}`,
    `Código: ${a.codigo}`,
  ].join("\n");
}

// Aviso automático por la API de WhatsApp Cloud (Meta). Solo se activa si están las
// variables de entorno; si no, la web usa el enlace wa.me de la página de confirmación.
//   WHATSAPP_TOKEN, WHATSAPP_PHONE_ID    credenciales de la app de Meta
//   WHATSAPP_AVISO_A                     número que recibe los avisos (por defecto el del negocio)
//   WHATSAPP_PLANTILLA                   plantilla aprobada con 6 variables: cliente, teléfono,
//                                        servicio, barbero, fecha y hora, código. Sin plantilla se
//                                        envía texto libre, que Meta solo entrega si hubo conversación
//                                        en las últimas 24 h.
export async function enviarAvisoWhatsApp(a: AvisoCita): Promise<void> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  if (!token || !phoneId) return;

  const plantilla = process.env.WHATSAPP_PLANTILLA;
  const cuerpo = plantilla
    ? {
        type: "template",
        template: {
          name: plantilla,
          language: { code: "es" },
          components: [
            {
              type: "body",
              parameters: [a.cliente, a.telefono, a.servicio, a.barbero, `${a.fecha}, ${a.hora}`, a.codigo].map((text) => ({
                type: "text",
                text,
              })),
            },
          ],
        },
      }
    : { type: "text", text: { body: textoAvisoCita(a) } };

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: process.env.WHATSAPP_AVISO_A ?? negocio.whatsapp,
        ...cuerpo,
      }),
    });
    if (!res.ok) console.error("WhatsApp respondió", res.status, await res.text());
  } catch (e) {
    console.error("No se pudo enviar el aviso de WhatsApp", e);
  }
}
