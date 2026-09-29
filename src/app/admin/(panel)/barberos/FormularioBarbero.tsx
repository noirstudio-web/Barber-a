"use client";

import Image from "next/image";
import { useActionState, useTransition } from "react";
import { Campo, Entrada, Mensaje } from "@/components/admin/Campo";
import { Boton } from "@/components/sitio/Boton";
import type { Barbero } from "@/db/schema";
import { alternarBarbero, guardarBarbero } from "../../acciones";

export function FormularioBarbero({ barbero }: { barbero: Barbero }) {
  const [estado, accion, pendiente] = useActionState(guardarBarbero, {});
  const [cambiando, iniciar] = useTransition();
  const p = `b${barbero.id}`;

  return (
    <form action={accion} className={`flex flex-col gap-5 rounded-2xl bg-superficie p-5 sm:flex-row ${barbero.activo ? "" : "opacity-60"}`}>
      <input type="hidden" name="id" value={barbero.id} />
      <Image src={barbero.foto} alt="" width={80} height={80} className="size-20 shrink-0 rounded-xl object-cover" />
      <div className="flex-1">
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo etiqueta="Nombre" id={`${p}-nombre`}>
            <Entrada id={`${p}-nombre`} name="nombre" required defaultValue={barbero.nombre} />
          </Campo>
          <Campo etiqueta="Especialidad" id={`${p}-esp`}>
            <Entrada id={`${p}-esp`} name="especialidad" required defaultValue={barbero.especialidad} />
          </Campo>
          <Campo etiqueta="Celular (WhatsApp)" id={`${p}-tel`} ayuda="Con indicativo. Ej: 573001234567">
            <Entrada id={`${p}-tel`} name="telefono" inputMode="tel" defaultValue={barbero.telefono ?? ""} placeholder="Sin celular" />
          </Campo>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Boton type="submit" disabled={pendiente} className="px-5 py-2">
            {pendiente ? "Guardando..." : "Guardar"}
          </Boton>
          <Boton
            type="button"
            variante="secundario"
            className="px-5 py-2"
            disabled={cambiando}
            onClick={() => iniciar(() => alternarBarbero(barbero.id, !barbero.activo))}
          >
            {barbero.activo ? "Ocultar" : "Mostrar"}
          </Boton>
          {!barbero.activo && <span className="text-xs text-tenue">No aparece en la web ni recibe reservas</span>}
          <Mensaje estado={estado} />
        </div>
      </div>
    </form>
  );
}
