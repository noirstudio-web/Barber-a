import { NextResponse, type NextRequest } from "next/server";
import { procesarCobroAutomatico, procesarPago, procesarSuscripcion } from "@/lib/cobros";
import { firmaValida, mpConfigurado } from "@/lib/mercadopago";

export const dynamic = "force-dynamic";

// Notificaciones de Mercado Pago (configurar en la aplicación: Webhooks -> esta URL).
// Llegan pagos, cambios del débito automático y sus cobros mensuales.
export async function POST(req: NextRequest) {
  const cuerpo = (await req.json().catch(() => ({}))) as { type?: string; topic?: string; data?: { id?: string | number } };
  const tipo = cuerpo.type ?? cuerpo.topic ?? req.nextUrl.searchParams.get("type") ?? req.nextUrl.searchParams.get("topic") ?? "";
  const id = String(cuerpo.data?.id ?? req.nextUrl.searchParams.get("data.id") ?? req.nextUrl.searchParams.get("id") ?? "");
  if (!id || !mpConfigurado()) return NextResponse.json({ ok: true, ignorado: true });

  if (!firmaValida(req.headers.get("x-signature"), req.headers.get("x-request-id"), id)) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  try {
    if (tipo === "payment") await procesarPago(id);
    else if (tipo === "subscription_preapproval" || tipo === "preapproval") await procesarSuscripcion(id);
    else if (tipo === "subscription_authorized_payment" || tipo === "authorized_payment") await procesarCobroAutomatico(id);
  } catch (e) {
    // Un recurso que no existe no se va a arreglar reintentando
    if (e instanceof Error && e.message.includes("respondió 404")) return NextResponse.json({ ok: true, ignorado: true });
    // Cualquier otro error hace que Mercado Pago reintente la notificación más tarde
    console.error("Error procesando notificación de Mercado Pago", tipo, id, e);
    return NextResponse.json({ error: "Error procesando" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
