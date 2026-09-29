"use client";

import { useActionState } from "react";
import { Campo, Entrada, Mensaje } from "@/components/admin/Campo";
import { Boton } from "@/components/sitio/Boton";
import { registrarse } from "../acciones";

export function FormularioRegistro() {
  const [estado, accion, pendiente] = useActionState(registrarse, {});
  return (
    <form action={accion} className="mt-6 space-y-4">
      <Campo etiqueta="Tu nombre" id="nombre">
        <Entrada key={`n${estado.valores?.nombre}`} id="nombre" name="nombre" defaultValue={estado.valores?.nombre} required minLength={2} maxLength={60} autoComplete="name" />
      </Campo>
      <Campo etiqueta="Usuario" id="usuario" ayuda="Sin espacios. Ej: mateo.rios">
        <Entrada key={`u${estado.valores?.usuario}`} id="usuario" name="usuario" defaultValue={estado.valores?.usuario} required minLength={3} maxLength={30} autoComplete="username" autoCapitalize="none" />
      </Campo>
      <Campo etiqueta="Contraseña" id="clave" ayuda="Mínimo 8 caracteres">
        <Entrada id="clave" name="clave" type="password" required minLength={8} autoComplete="new-password" />
      </Campo>
      <Campo etiqueta="Repite la contraseña" id="clave2">
        <Entrada id="clave2" name="clave2" type="password" required minLength={8} autoComplete="new-password" />
      </Campo>
      <Campo etiqueta="Código del negocio" id="codigo">
        <Entrada id="codigo" name="codigo" type="password" required autoComplete="off" />
      </Campo>
      <Mensaje estado={estado} />
      <Boton type="submit" disabled={pendiente} className="w-full py-3.5">
        {pendiente ? "Creando..." : "Crear usuario"}
      </Boton>
    </form>
  );
}
