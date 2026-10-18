"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { planes } from "@/config/planes";
import { getDb } from "@/db";
import { compras } from "@/db/schema";
import { crearLinkDePago, mpConfigurado } from "@/lib/mercadopago";
import { urlSitio } from "@/lib/url";
import type { EstadoFormulario } from "../admin/acciones";

const esquema = z.object({
  plan: z.enum(["basico", "premium"]),
  nombre: z.string().trim().min(2, "Escribe tu nombre").max(80),
  email: z.string().trim().email("Escribe un correo válido").max(120),
  whatsapp: z
    .string()
    .transform((t) => t.replace(/\D/g, ""))
    .refine((t) => t.length >= 10 && t.length <= 15, "Escribe tu WhatsApp con indicativo, ej: 573001234567"),
});

// Guarda la compra y lleva al cliente a pagar en Mercado Pago
export async function iniciarCompra(_: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const valores = { nombre: String(form.get("nombre") ?? ""), email: String(form.get("email") ?? ""), whatsapp: String(form.get("whatsapp") ?? "") };
  if (!mpConfigurado()) return { error: "Los pagos en línea todavía no están disponibles. Escríbenos por WhatsApp.", valores };
  const d = esquema.safeParse({ plan: form.get("plan"), ...valores });
  if (!d.success) return { error: d.error.issues[0]?.message ?? "Revisa los datos", valores };

  const id = randomUUID();
  const db = await getDb();
  await db.insert(compras).values({ id, plan: d.data.plan, nombre: d.data.nombre, email: d.data.email, whatsapp: d.data.whatsapp });

  const base = await urlSitio();
  let link: string;
  try {
    link = await crearLinkDePago({
      titulo: `Noir Studio - Plan ${planes[d.data.plan].nombre} (1 mes)`,
      precio: planes[d.data.plan].precio,
      referencia: `compra:${id}`,
      urlBase: base,
      urlRegreso: `${base}/comprar/listo?compra=${id}`,
      email: d.data.email,
    });
  } catch (e) {
    console.error("No se pudo crear el link de pago", e);
    return { error: "No pudimos conectar con Mercado Pago. Inténtalo de nuevo en un momento.", valores };
  }
  redirect(link);
}
