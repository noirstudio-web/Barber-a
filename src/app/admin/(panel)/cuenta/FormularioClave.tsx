"use client";

import { useActionState } from "react";
import { Campo, Entrada, Mensaje } from "@/components/admin/Campo";
import { Boton } from "@/components/sitio/Boton";
import { cambiarClave } from "../../acciones";

export function FormularioClave() {
  const [estado, accion, pendiente] = useActionState(cambiarClave, {});
  return (
    <form action={accion} className="mt-4 max-w-sm space-y-4">
      <Campo etiqueta="Contraseña actual" id="actual">
        <Entrada id="actual" name="actual" type="password" required autoComplete="current-password" />
      </Campo>
      <Campo etiqueta="Nueva contraseña" id="nueva" ayuda="Mínimo 8 caracteres">
        <Entrada id="nueva" name="nueva" type="password" required minLength={8} autoComplete="new-password" />
      </Campo>
      <Campo etiqueta="Repite la nueva contraseña" id="nueva2">
        <Entrada id="nueva2" name="nueva2" type="password" required minLength={8} autoComplete="new-password" />
      </Campo>
      <Mensaje estado={estado} />
      <Boton type="submit" disabled={pendiente}>
        {pendiente ? "Guardando..." : "Cambiar contraseña"}
      </Boton>
    </form>
  );
}
