import { region } from "@/config/region";

export function enlaceWhatsApp(texto: string | undefined, numero: string): string {
  return `https://wa.me/${numero}${texto ? `?text=${encodeURIComponent(texto)}` : ""}`;
}

// Celulares locales de 10 dígitos llevan el indicativo del país delante
export function numeroInternacional(telefono: string): string {
  const digitos = telefono.replace(/\D/g, "");
  return digitos.length === 10 ? `${region.indicativo}${digitos}` : digitos;
}

export type DatosNegocio = { nombre: string; direccion: string; whatsapp: string };

export type DatosCita = {
  negocio: DatosNegocio;
  codigo: string;
  cliente: string;
  telefono: string;
  servicio: string;
  barbero: string;
  fecha: string;
  hora: string;
};

export function textoAvisoCita(a: DatosCita): string {
  return [
    `Nueva cita en ${a.negocio.nombre}`,
    `Cliente: ${a.cliente} (${a.telefono})`,
    `Servicio: ${a.servicio}`,
    `Barbero: ${a.barbero}`,
    `Fecha: ${a.fecha}, ${a.hora}`,
    `Código: ${a.codigo}`,
  ].join("\n");
}

export function textoRecordatorioCliente(a: DatosCita): string {
  return `Hola ${a.cliente.split(" ")[0]}, te recordamos tu cita de ${a.servicio} con ${a.barbero} el ${a.fecha} a las ${a.hora} en ${a.negocio.nombre} (${a.negocio.direccion}). Si no puedes venir, avísanos por aquí.`;
}

export function textoRecordatorioBarbero(a: DatosCita): string {
  return `Recordatorio: el ${a.fecha} a las ${a.hora} tienes ${a.servicio} con ${a.cliente} (${a.telefono}).`;
}

// ---------------------------------------------------------------------------
// Envío automático por la API de WhatsApp Cloud (Meta). Solo se activa con las
// variables de entorno; sin ellas no se envía nada y el panel ofrece enlaces wa.me.
//
//   WHATSAPP_TOKEN, WHATSAPP_PHONE_ID   credenciales de la app de Meta
//   WHATSAPP_IDIOMA                     idioma de las plantillas (por defecto "es")
//
// Los avisos de cada barbería van a su propio WhatsApp y al celular de sus barberos.
// Plantillas (deben estar aprobadas por Meta). Si falta una, se envía texto libre,
// que Meta solo entrega si esa persona escribió al negocio en las últimas 24 h.
//   WHATSAPP_PLANTILLA                        nueva cita: cliente, teléfono, servicio,
//                                             barbero, fecha y hora, código
//   WHATSAPP_PLANTILLA_RECORDATORIO_CLIENTE   nombre, servicio, barbero, hora,
//                                             barbería y dirección
//   WHATSAPP_PLANTILLA_RECORDATORIO_BARBERO   barbero, cliente, servicio, hora, teléfono
// ---------------------------------------------------------------------------

export function whatsappConfigurado(): boolean {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID);
}

async function enviar(para: string, plantilla: string | undefined, parametros: string[], textoLibre: string): Promise<boolean> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  if (!token || !phoneId || !para) return false;

  const cuerpo = plantilla
    ? {
        type: "template",
        template: {
          name: plantilla,
          language: { code: process.env.WHATSAPP_IDIOMA ?? "es" },
          components: [{ type: "body", parameters: parametros.map((text) => ({ type: "text", text })) }],
        },
      }
    : { type: "text", text: { body: textoLibre } };

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to: numeroInternacional(para), ...cuerpo }),
    });
    if (!res.ok) console.error("WhatsApp respondió", res.status, await res.text());
    return res.ok;
  } catch (e) {
    console.error("No se pudo enviar el WhatsApp", e);
    return false;
  }
}

// Al reservar: aviso al negocio y al barbero asignado
export async function enviarAvisoNuevaCita(a: DatosCita, telefonoBarbero: string | null): Promise<void> {
  const parametros = [a.cliente, a.telefono, a.servicio, a.barbero, `${a.fecha}, ${a.hora}`, a.codigo];
  const plantilla = process.env.WHATSAPP_PLANTILLA;
  const destinos = new Set([a.negocio.whatsapp, telefonoBarbero ?? ""].filter(Boolean).map(numeroInternacional));
  await Promise.all([...destinos].map((n) => enviar(n, plantilla, parametros, textoAvisoCita(a))));
}

export async function enviarRecordatorios(a: DatosCita, telefonoBarbero: string | null): Promise<void> {
  await Promise.all([
    enviar(
      a.telefono,
      process.env.WHATSAPP_PLANTILLA_RECORDATORIO_CLIENTE,
      [a.cliente.split(" ")[0], a.servicio, a.barbero, a.hora, `${a.negocio.nombre} (${a.negocio.direccion})`],
      textoRecordatorioCliente(a),
    ),
    telefonoBarbero
      ? enviar(
          telefonoBarbero,
          process.env.WHATSAPP_PLANTILLA_RECORDATORIO_BARBERO,
          [a.barbero.split(" ")[0], a.cliente, a.servicio, a.hora, a.telefono],
          textoRecordatorioBarbero(a),
        )
      : Promise.resolve(false),
  ]);
}
