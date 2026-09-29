"use client";

import { useActionState } from "react";
import { Campo, claseCampo, Entrada, Mensaje } from "@/components/admin/Campo";
import { Boton } from "@/components/sitio/Boton";
import { crearUsuarioEquipo } from "../../acciones";

export function FormularioUsuario() {
  const [estado, accion, pendiente] = useActionState(crearUsuarioEquipo, {});
  const v = estado.valores;
  return (
    <form action={accion} className="mt-4 space-y-4 rounded-2xl border border-dashed border-linea p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Nombre" id="u-nombre">
          <Entrada key={`n${v?.nombre}`} id="u-nombre" name="nombre" required minLength={2} maxLength={60} defaultValue={v?.nombre} />
        </Campo>
        <Campo etiqueta="Usuario" id="u-usuario" ayuda="Sin espacios">
          <Entrada key={`u${v?.usuario}`} id="u-usuario" name="usuario" required minLength={3} maxLength={30} autoCapitalize="none" defaultValue={v?.usuario} />
        </Campo>
        <Campo etiqueta="Contraseña" id="u-clave" ayuda="Mínimo 8 caracteres">
          <Entrada id="u-clave" name="clave" type="password" required minLength={8} autoComplete="new-password" />
        </Campo>
        <Campo etiqueta="Permisos" id="u-rol">
          <select id="u-rol" name="rol" className={claseCampo} defaultValue="equipo">
            <option value="equipo">Equipo (agenda, clientes, servicios)</option>
            <option value="dueno">Dueño (todo)</option>
          </select>
        </Campo>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Boton type="submit" disabled={pendiente}>
          {pendiente ? "Creando..." : "Crear usuario"}
        </Boton>
        <Mensaje estado={estado} />
      </div>
    </form>
  );
}
