"use client";

import { useActionState } from "react";
import { Campo, Entrada, Mensaje } from "@/components/admin/Campo";
import { Boton } from "@/components/sitio/Boton";
import { crearUsuarioNoir } from "../../acciones";

export function FormularioEquipoNoir() {
  const [estado, accion, pendiente] = useActionState(crearUsuarioNoir, {});
  const v = estado.valores;
  return (
    <form action={accion} className="mt-4 space-y-4 rounded-2xl border border-dashed border-linea p-5">
      <p className="text-sm font-semibold">Agregar administrador</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <Campo etiqueta="Nombre" id="n-nombre">
          <Entrada key={`n${v?.nombre}`} id="n-nombre" name="nombre" required defaultValue={v?.nombre} />
        </Campo>
        <Campo etiqueta="Usuario" id="n-usuario">
          <Entrada key={`u${v?.usuario}`} id="n-usuario" name="usuario" required autoCapitalize="none" defaultValue={v?.usuario} />
        </Campo>
        <Campo etiqueta="Contraseña" id="n-clave">
          <Entrada id="n-clave" name="clave" type="password" required minLength={8} autoComplete="new-password" />
        </Campo>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Boton type="submit" disabled={pendiente}>
          {pendiente ? "Creando..." : "Crear cuenta"}
        </Boton>
        <Mensaje estado={estado} />
      </div>
    </form>
  );
}
