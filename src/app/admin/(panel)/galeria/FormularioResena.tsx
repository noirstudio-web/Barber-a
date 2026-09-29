"use client";

import { useActionState } from "react";
import { Campo, claseCampo, Entrada, Mensaje } from "@/components/admin/Campo";
import { Boton } from "@/components/sitio/Boton";
import { crearResena } from "../../acciones";

export function FormularioResena() {
  const [estado, accion, pendiente] = useActionState(crearResena, {});
  return (
    <form action={accion} className="mt-6 space-y-4 rounded-2xl border border-linea p-5">
      <Campo etiqueta="Reseña" id="texto">
        <textarea id="texto" name="texto" required rows={3} maxLength={220} className={claseCampo} />
      </Campo>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Nombre del cliente" id="nombre-resena">
          <Entrada id="nombre-resena" name="nombre" required maxLength={60} />
        </Campo>
        <Campo etiqueta="Detalle (opcional)" id="detalle">
          <Entrada id="detalle" name="detalle" maxLength={60} placeholder="Corte + barba" />
        </Campo>
      </div>
      <div className="flex items-center gap-4">
        <Boton type="submit" disabled={pendiente}>
          {pendiente ? "Guardando..." : "Agregar reseña"}
        </Boton>
        <Mensaje estado={estado} />
      </div>
    </form>
  );
}
