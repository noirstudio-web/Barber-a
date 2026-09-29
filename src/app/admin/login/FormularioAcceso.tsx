"use client";

import { useActionState } from "react";
import { Campo, Entrada, Mensaje } from "@/components/admin/Campo";
import { Boton } from "@/components/sitio/Boton";
import { iniciarSesion } from "../acciones";

export function FormularioAcceso() {
  const [estado, accion, pendiente] = useActionState(iniciarSesion, {});
  return (
    <form action={accion} className="mt-6 space-y-4">
      <Campo etiqueta="Usuario" id="usuario">
        <Entrada key={estado.valores?.usuario} id="usuario" name="usuario" defaultValue={estado.valores?.usuario} required autoComplete="username" autoCapitalize="none" className="py-3" />
      </Campo>
      <Campo etiqueta="Contraseña" id="clave">
        <Entrada id="clave" name="clave" type="password" required autoComplete="current-password" className="py-3" />
      </Campo>
      <Mensaje estado={estado} />
      <Boton type="submit" disabled={pendiente} className="w-full py-3.5">
        {pendiente ? "Entrando..." : "Entrar"}
      </Boton>
    </form>
  );
}
