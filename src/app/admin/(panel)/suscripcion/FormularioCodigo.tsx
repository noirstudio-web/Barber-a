"use client";

import { useActionState } from "react";
import { Entrada, Mensaje } from "@/components/admin/Campo";
import { Boton } from "@/components/sitio/Boton";
import { canjearCodigo } from "../../acciones";

export function FormularioCodigo() {
  const [estado, accion, pendiente] = useActionState(canjearCodigo, {});
  return (
    <form action={accion} className="mt-4 max-w-md space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="codigo" className="sr-only">
          Código
        </label>
        <Entrada id="codigo" name="codigo" required placeholder="NOIR-XXXX-XXXX" autoComplete="off" autoCapitalize="characters" className="flex-1 font-mono tracking-widest" />
        <Boton type="submit" disabled={pendiente}>
          {pendiente ? "Activando..." : "Activar código"}
        </Boton>
      </div>
      <Mensaje estado={estado} />
    </form>
  );
}
