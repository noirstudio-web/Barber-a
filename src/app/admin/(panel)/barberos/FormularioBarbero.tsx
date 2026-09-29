"use client";

import Image from "next/image";
import { useActionState, useState, useTransition } from "react";
import { Campo, Entrada, Mensaje } from "@/components/admin/Campo";
import { SelectorFoto } from "@/components/admin/SelectorFoto";
import { Avatar } from "@/components/sitio/Avatar";
import { Boton } from "@/components/sitio/Boton";
import type { Barbero } from "@/db/schema";
import { alternarBarbero, guardarBarbero } from "../../acciones";

export function FormularioBarbero({ barbero }: { barbero: Barbero | null }) {
  const [estado, accion, pendiente] = useActionState(guardarBarbero, {});
  const [cambiando, iniciar] = useTransition();
  const [errorAlternar, setErrorAlternar] = useState<string | undefined>();
  const p = barbero ? `b${barbero.id}` : "nuevo";
  const oculto = barbero !== null && !barbero.activo;

  return (
    <form
      action={accion}
      className={`flex flex-col gap-5 rounded-2xl p-5 sm:flex-row ${barbero ? "bg-superficie" : "border border-dashed border-linea"} ${oculto ? "opacity-60" : ""}`}
    >
      {barbero && <input type="hidden" name="id" value={barbero.id} />}
      <SelectorFoto
        nombre="foto"
        etiqueta={barbero?.foto ? "Cambiar foto" : "Subir foto"}
        vistaPrevia={
          barbero?.foto ? (
            <Image src={barbero.foto} alt="" width={96} height={96} className="size-24 rounded-xl object-cover" />
          ) : (
            <Avatar nombre={barbero?.nombre ?? "+"} className="size-24 rounded-xl text-2xl" />
          )
        }
      />
      <div className="flex-1">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Nombre" id={`${p}-nombre`}>
            <Entrada id={`${p}-nombre`} name="nombre" required defaultValue={barbero?.nombre} />
          </Campo>
          <Campo etiqueta="Especialidad" id={`${p}-esp`}>
            <Entrada id={`${p}-esp`} name="especialidad" required defaultValue={barbero?.especialidad} placeholder="Fades, barba, color..." />
          </Campo>
          <Campo etiqueta="Estilo (frase corta)" id={`${p}-estilo`}>
            <Entrada id={`${p}-estilo`} name="estilo" maxLength={120} defaultValue={barbero?.estilo} />
          </Campo>
          <Campo etiqueta="Celular (WhatsApp)" id={`${p}-tel`} ayuda="Con indicativo. Ej: 573001234567">
            <Entrada id={`${p}-tel`} name="telefono" inputMode="tel" defaultValue={barbero?.telefono ?? ""} placeholder="Sin celular" />
          </Campo>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Boton type="submit" disabled={pendiente} className="px-5 py-2">
            {pendiente ? "Guardando..." : barbero ? "Guardar" : "Agregar"}
          </Boton>
          {barbero && (
            <Boton
              type="button"
              variante="secundario"
              className="px-5 py-2"
              disabled={cambiando}
              onClick={() =>
                iniciar(async () => {
                  const r = await alternarBarbero(barbero.id, !barbero.activo);
                  setErrorAlternar(r.error);
                })
              }
            >
              {barbero.activo ? "Ocultar" : "Mostrar"}
            </Boton>
          )}
          {oculto && <span className="text-xs text-tenue">No aparece en la web ni recibe reservas</span>}
          <Mensaje estado={errorAlternar ? { error: errorAlternar } : estado} />
        </div>
      </div>
    </form>
  );
}
