"use client";

import { useActionState } from "react";
import { Campo, Entrada, Mensaje } from "@/components/admin/Campo";
import { Boton } from "@/components/sitio/Boton";
import { registrarNoir } from "../acciones";

export function FormularioNoir() {
  const [estado, accion, pendiente] = useActionState(registrarNoir, {});
  const v = estado.valores;
  return (
    <form action={accion} className="mt-6 space-y-4">
      <Campo etiqueta="Tu nombre" id="nombre">
        <Entrada key={`n${v?.nombre}`} id="nombre" name="nombre" required defaultValue={v?.nombre} autoComplete="name" />
      </Campo>
      <Campo etiqueta="Usuario" id="usuario">
        <Entrada key={`u${v?.usuario}`} id="usuario" name="usuario" required autoCapitalize="none" defaultValue={v?.usuario} autoComplete="username" />
      </Campo>
      <Campo etiqueta="Contraseña" id="clave" ayuda="Mínimo 8 caracteres">
        <Entrada id="clave" name="clave" type="password" required minLength={8} autoComplete="new-password" />
      </Campo>
      <Campo etiqueta="Código maestro" id="maestro">
        <Entrada id="maestro" name="maestro" type="password" required autoComplete="off" />
      </Campo>
      <Mensaje estado={estado} />
      <Boton type="submit" disabled={pendiente} className="w-full py-3.5">
        {pendiente ? "Creando..." : "Crear cuenta"}
      </Boton>
    </form>
  );
}
