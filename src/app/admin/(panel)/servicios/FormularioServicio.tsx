"use client";

import { useActionState, useTransition } from "react";
import { Campo, Entrada, Mensaje } from "@/components/admin/Campo";
import { Boton } from "@/components/sitio/Boton";
import type { Servicio } from "@/db/schema";
import { alternarServicio, guardarServicio } from "../../acciones";

export function FormularioServicio({ servicio }: { servicio: Servicio | null }) {
  const [estado, accion, pendiente] = useActionState(guardarServicio, {});
  const [cambiando, iniciar] = useTransition();
  const p = servicio ? `s${servicio.id}` : "nuevo";
  const oculto = servicio !== null && !servicio.activo;

  return (
    <form action={accion} className={`rounded-2xl p-5 transition ${servicio ? "bg-superficie" : "border border-dashed border-linea"} ${oculto ? "opacity-60" : ""}`}>
      {servicio && <input type="hidden" name="id" value={servicio.id} />}
      <div className="grid gap-4 sm:grid-cols-12">
        <div className="sm:col-span-4">
          <Campo etiqueta="Nombre" id={`${p}-nombre`}>
            <Entrada id={`${p}-nombre`} name="nombre" required defaultValue={servicio?.nombre} />
          </Campo>
        </div>
        <div className="sm:col-span-4">
          <Campo etiqueta="Descripción" id={`${p}-desc`}>
            <Entrada id={`${p}-desc`} name="descripcion" maxLength={160} defaultValue={servicio?.descripcion} />
          </Campo>
        </div>
        <div className="sm:col-span-2">
          <Campo etiqueta="Minutos" id={`${p}-dur`}>
            <Entrada id={`${p}-dur`} name="duracionMin" type="number" min={5} max={480} step={5} required defaultValue={servicio?.duracionMin ?? 30} />
          </Campo>
        </div>
        <div className="sm:col-span-2">
          <Campo etiqueta="Precio" id={`${p}-precio`}>
            <Entrada id={`${p}-precio`} name="precio" inputMode="numeric" required defaultValue={servicio?.precio} />
          </Campo>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Boton type="submit" disabled={pendiente} className="px-5 py-2">
          {pendiente ? "Guardando..." : servicio ? "Guardar" : "Agregar"}
        </Boton>
        {servicio && (
          <Boton
            type="button"
            variante="secundario"
            className="px-5 py-2"
            disabled={cambiando}
            onClick={() => iniciar(() => alternarServicio(servicio.id, !servicio.activo))}
          >
            {servicio.activo ? "Ocultar" : "Mostrar"}
          </Boton>
        )}
        {oculto && <span className="text-xs text-tenue">Oculto en la web</span>}
        <Mensaje estado={estado} />
      </div>
    </form>
  );
}
