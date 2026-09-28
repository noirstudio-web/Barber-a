"use client";

import { useActionState } from "react";
import { Boton } from "@/components/sitio/Boton";
import { iniciarSesion } from "../acciones";

export function FormularioAcceso() {
  const [estado, accion, pendiente] = useActionState(iniciarSesion, {});
  return (
    <form action={accion} className="mt-6 space-y-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="clave" className="text-sm font-medium">Clave de acceso</label>
        <input
          id="clave"
          name="clave"
          type="password"
          required
          autoComplete="current-password"
          className="rounded-xl border border-linea bg-superficie px-4 py-3 outline-none transition focus:border-cromo"
        />
        {estado.error && <p role="alert" className="text-sm text-peligro">{estado.error}</p>}
      </div>
      <Boton type="submit" disabled={pendiente} className="w-full py-3.5">
        {pendiente ? "Entrando..." : "Entrar"}
      </Boton>
    </form>
  );
}
