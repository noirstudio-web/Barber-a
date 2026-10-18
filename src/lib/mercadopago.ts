import { createHmac, timingSafeEqual } from "node:crypto";

// Cliente mínimo de la API de Mercado Pago (https://www.mercadopago.com.co/developers).
//
//   MP_ACCESS_TOKEN     Access Token de la aplicación (TEST-... para pruebas, APP_USR-... real)
//   MP_WEBHOOK_SECRET   Clave secreta de las notificaciones (Webhooks), para verificar la firma
//
// Los cobros son en pesos colombianos.

// MP_API_URL solo se usa en pruebas, para apuntar a una API simulada
const API = process.env.MP_API_URL ?? "https://api.mercadopago.com";

export function mpConfigurado(): boolean {
  return Boolean(process.env.MP_ACCESS_TOKEN);
}

// Con credenciales de prueba se usa el checkout de sandbox
function esPrueba() {
  return process.env.MP_ACCESS_TOKEN?.startsWith("TEST-") ?? false;
}

async function mp<T>(ruta: string, init: RequestInit & { idempotencia?: string } = {}): Promise<T> {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) throw new Error("Mercado Pago no está configurado (falta MP_ACCESS_TOKEN).");
  const res = await fetch(`${API}${ruta}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.idempotencia ? { "X-Idempotency-Key": init.idempotencia } : {}),
      ...init.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Mercado Pago respondió ${res.status} en ${ruta}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Pago único con link (Checkout Pro): PSE, Nequi, tarjetas, Efecty...
// ---------------------------------------------------------------------------

export async function crearLinkDePago(opciones: {
  titulo: string;
  precio: number;
  referencia: string;
  urlBase: string;
  urlRegreso: string;
  email?: string;
}): Promise<string> {
  const r = await mp<{ init_point: string; sandbox_init_point: string }>("/checkout/preferences", {
    method: "POST",
    body: JSON.stringify({
      items: [{ id: opciones.referencia, title: opciones.titulo, quantity: 1, unit_price: opciones.precio, currency_id: "COP" }],
      external_reference: opciones.referencia,
      notification_url: `${opciones.urlBase}/api/mercadopago/webhook`,
      back_urls: { success: opciones.urlRegreso, pending: opciones.urlRegreso, failure: opciones.urlRegreso },
      auto_return: "approved",
      statement_descriptor: "NOIR STUDIO",
      ...(opciones.email ? { payer: { email: opciones.email } } : {}),
    }),
  });
  return esPrueba() ? r.sandbox_init_point : r.init_point;
}

export type PagoMp = {
  id: number;
  status: "approved" | "pending" | "in_process" | "rejected" | "cancelled" | "refunded" | "charged_back" | string;
  status_detail: string;
  external_reference: string | null;
  transaction_amount: number;
  currency_id: string;
  date_approved: string | null;
  payer?: { email?: string; first_name?: string; last_name?: string };
  payment_method_id?: string;
};

export function obtenerPago(id: string | number) {
  return mp<PagoMp>(`/v1/payments/${encodeURIComponent(String(id))}`);
}

// ---------------------------------------------------------------------------
// Débito automático mensual (suscripciones / preapproval): solo tarjeta
// ---------------------------------------------------------------------------

export type SuscripcionMp = {
  id: string;
  status: "pending" | "authorized" | "paused" | "cancelled" | string;
  external_reference: string | null;
  payer_email?: string;
  init_point: string;
  auto_recurring: { transaction_amount: number; currency_id: string };
};

export async function crearDebitoAutomatico(opciones: {
  titulo: string;
  precio: number;
  referencia: string;
  email: string;
  urlRegreso: string;
}): Promise<SuscripcionMp> {
  return mp<SuscripcionMp>("/preapproval", {
    method: "POST",
    body: JSON.stringify({
      reason: opciones.titulo,
      external_reference: opciones.referencia,
      payer_email: opciones.email,
      back_url: opciones.urlRegreso,
      status: "pending",
      auto_recurring: { frequency: 1, frequency_type: "months", transaction_amount: opciones.precio, currency_id: "COP" },
    }),
  });
}

export function obtenerSuscripcion(id: string) {
  return mp<SuscripcionMp>(`/preapproval/${encodeURIComponent(id)}`);
}

export function cancelarDebitoAutomatico(id: string) {
  return mp<SuscripcionMp>(`/preapproval/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify({ status: "cancelled" }) });
}

// Cada cobro mensual del débito automático
export type CobroAutomaticoMp = {
  id: number;
  preapproval_id: string;
  status: string;
  transaction_amount: number;
  currency_id: string;
  payment?: { id: number; status: string };
};

export function obtenerCobroAutomatico(id: string) {
  return mp<CobroAutomaticoMp>(`/authorized_payments/${encodeURIComponent(id)}`);
}

// ---------------------------------------------------------------------------
// Firma de las notificaciones
// ---------------------------------------------------------------------------

// Mercado Pago firma cada notificación con x-signature ("ts=...,v1=...") sobre el texto
// "id:<data.id>;request-id:<x-request-id>;ts:<ts>;". Si no hay clave configurada no se valida,
// pero igual cada pago se vuelve a consultar en la API antes de aplicarlo.
export function firmaValida(firma: string | null, requestId: string | null, dataId: string): boolean {
  const secreto = process.env.MP_WEBHOOK_SECRET;
  if (!secreto) return true;
  if (!firma) return false;
  const partes = Object.fromEntries(firma.split(",").map((p) => p.trim().split("=") as [string, string]));
  if (!partes.ts || !partes.v1) return false;
  const manifiesto = `id:${dataId.toLowerCase()};${requestId ? `request-id:${requestId};` : ""}ts:${partes.ts};`;
  const esperado = createHmac("sha256", secreto).update(manifiesto).digest("hex");
  const a = Buffer.from(esperado);
  const b = Buffer.from(partes.v1);
  return a.length === b.length && timingSafeEqual(a, b);
}
