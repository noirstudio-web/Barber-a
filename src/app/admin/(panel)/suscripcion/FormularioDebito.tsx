"use client";

import { useActionState } from "react";
import { Campo, claseCampo, Entrada, Mensaje } from "@/components/admin/Campo";
import { Boton } from "@/components/sitio/Boton";
import { fmtPrecio, planes } from "@/config/planes";
import { activarDebito } from "./acciones-mp";

export function FormularioDebito({ planActual }: { planActual: "basico" | "premium" }) {
  const [estado, accion, pendiente] = useActionState(activarDebito, {});
  return (
    <form action={accion} className="mt-4 space-y-4 rounded-2xl border border-linea p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Plan" id="debito-plan">
          <select id="debito-plan" name="plan" defaultValue={planActual} className={claseCampo}>
            {(["basico", "premium"] as const).map((p) => (
              <option key={p} value={p}>
                {planes[p].nombre}: {fmtPrecio(planes[p].precio)} al mes
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Correo de tu cuenta de Mercado Pago" id="debito-email">
          <Entrada id="debito-email" name="email" type="email" required autoComplete="email" />
        </Campo>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Boton type="submit" disabled={pendiente}>
          {pendiente ? "Abriendo Mercado Pago..." : "Activar débito automático"}
        </Boton>
        <Mensaje estado={estado} />
      </div>
    </form>
  );
}
