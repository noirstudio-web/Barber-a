"use client";

import { CreditCardIcon } from "@phosphor-icons/react";
import { useActionState } from "react";
import { Campo, Entrada, Mensaje } from "@/components/admin/Campo";
import { Boton } from "@/components/sitio/Boton";
import { iniciarCompra } from "../acciones";

export function FormularioCompra({ plan }: { plan: "basico" | "premium" }) {
  const [estado, accion, pendiente] = useActionState(iniciarCompra, {});
  const v = estado.valores;
  return (
    <form action={accion} className="mt-6 space-y-4 rounded-2xl border border-linea p-6">
      <input type="hidden" name="plan" value={plan} />
      <Campo etiqueta="Tu nombre" id="nombre">
        <Entrada key={`n${v?.nombre}`} id="nombre" name="nombre" required autoComplete="name" defaultValue={v?.nombre} />
      </Campo>
      <Campo etiqueta="Correo" id="email" ayuda="Aquí te llega el comprobante de Mercado Pago">
        <Entrada key={`e${v?.email}`} id="email" name="email" type="email" required autoComplete="email" defaultValue={v?.email} />
      </Campo>
      <Campo etiqueta="WhatsApp" id="whatsapp" ayuda="Con indicativo, ej: 573001234567. Por aquí te damos soporte">
        <Entrada key={`w${v?.whatsapp}`} id="whatsapp" name="whatsapp" inputMode="tel" required autoComplete="tel" defaultValue={v?.whatsapp} />
      </Campo>
      <Mensaje estado={estado} />
      <Boton type="submit" disabled={pendiente} className="w-full py-3.5">
        <CreditCardIcon size={18} /> {pendiente ? "Abriendo Mercado Pago..." : "Pagar con Mercado Pago"}
      </Boton>
    </form>
  );
}
