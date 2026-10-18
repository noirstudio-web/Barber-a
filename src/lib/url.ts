import { headers } from "next/headers";

// Dirección pública del sitio (para los enlaces de regreso y notificaciones de Mercado Pago)
export async function urlSitio(): Promise<string> {
  if (process.env.NEXT_PUBLIC_URL_SITIO) return process.env.NEXT_PUBLIC_URL_SITIO.replace(/\/$/, "");
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
}
