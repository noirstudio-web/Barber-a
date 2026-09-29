"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { Campo, claseCampo, Entrada, Mensaje } from "@/components/admin/Campo";
import { SelectorFoto } from "@/components/admin/SelectorFoto";
import { Boton } from "@/components/sitio/Boton";
import { nombresDias } from "@/config/region";
import type { Barberia } from "@/db/schema";
import { minutosAHora } from "@/lib/tiempo";
import { guardarBarberia } from "../../acciones";

const ORDEN_DIAS = [1, 2, 3, 4, 5, 6, 0];

export function FormularioBarberia({ barberia, premium }: { barberia: Barberia; premium: boolean }) {
  const [estado, accion, pendiente] = useActionState(guardarBarberia, {});
  const [cerrados, setCerrados] = useState<Record<number, boolean>>(
    Object.fromEntries(ORDEN_DIAS.map((d) => [d, barberia.horario[d] === null])),
  );

  return (
    <form action={accion} className="mt-8 space-y-10">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Datos principales</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Nombre de la barbería" id="nombre">
            <Entrada id="nombre" name="nombre" required maxLength={60} defaultValue={barberia.nombre} />
          </Campo>
          <Campo etiqueta="Dirección de tu web" id="slug" ayuda="Si la cambias, el enlace anterior deja de funcionar">
            <Entrada id="slug" name="slug" required defaultValue={barberia.slug} autoCapitalize="none" />
          </Campo>
        </div>
        <Campo etiqueta="Frase principal" id="eslogan" ayuda="Aparece grande en la portada. Ej: Tu corte, a la hora que elijas.">
          <Entrada id="eslogan" name="eslogan" maxLength={80} defaultValue={barberia.eslogan} />
        </Campo>
        <Campo etiqueta="Descripción" id="descripcion" ayuda="Una o dos frases sobre tu barbería">
          <textarea id="descripcion" name="descripcion" rows={3} maxLength={240} defaultValue={barberia.descripcion} className={claseCampo} />
        </Campo>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Promoción destacada</h2>
        {premium ? (
          <Campo etiqueta="Anuncio en la parte de arriba de tu web" id="anuncio" ayuda="Déjalo vacío para no mostrar nada. Ej: 20% de descuento en corte + barba los martes">
            <Entrada id="anuncio" name="anuncio" maxLength={120} defaultValue={barberia.anuncio} />
          </Campo>
        ) : (
          <p className="rounded-xl bg-superficie px-4 py-3 text-sm text-tenue">Disponible en el plan Premium: muestra una promoción destacada arriba de tu web.</p>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Contacto y ubicación</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="WhatsApp" id="whatsapp" ayuda="Con indicativo, ej: 573001234567. Aquí llegan los avisos de citas.">
            <Entrada id="whatsapp" name="whatsapp" inputMode="tel" defaultValue={barberia.whatsapp} />
          </Campo>
          <Campo etiqueta="Instagram" id="instagram" ayuda="Enlace completo a tu perfil">
            <Entrada id="instagram" name="instagram" type="url" defaultValue={barberia.instagram} placeholder="https://instagram.com/tubarberia" />
          </Campo>
        </div>
        <Campo etiqueta="Dirección" id="direccion" ayuda="Se usa para el mapa y el botón Cómo llegar. Incluye la ciudad.">
          <Entrada id="direccion" name="direccion" maxLength={120} defaultValue={barberia.direccion} placeholder="Calle 10 # 20-30, Medellín" />
        </Campo>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Horario de atención</h2>
        <div className="space-y-2">
          {ORDEN_DIAS.map((d) => {
            const h = barberia.horario[d];
            return (
              <div key={d} className="grid grid-cols-[6.5rem_1fr] items-center gap-3 rounded-xl bg-superficie px-4 py-2.5 sm:grid-cols-[7rem_auto_1fr]">
                <span className="text-sm font-medium">{nombresDias[d]}</span>
                <label className="flex items-center gap-2 text-sm text-tenue">
                  <input
                    type="checkbox"
                    name={`cerrado-${d}`}
                    checked={cerrados[d]}
                    onChange={(e) => setCerrados((c) => ({ ...c, [d]: e.target.checked }))}
                    className="size-4 accent-[var(--cromo)]"
                  />
                  Cerrado
                </label>
                <div className={`col-span-2 flex items-center gap-2 sm:col-span-1 ${cerrados[d] ? "invisible" : ""}`}>
                  <input type="time" name={`abre-${d}`} step={900} defaultValue={minutosAHora(h?.abre ?? 540)} aria-label={`${nombresDias[d]} abre`} className={`${claseCampo} py-1.5`} />
                  <span className="text-tenue">a</span>
                  <input type="time" name={`cierra-${d}`} step={900} defaultValue={minutosAHora(h?.cierra ?? 1140)} aria-label={`${nombresDias[d]} cierra`} className={`${claseCampo} py-1.5`} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Imágenes</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-medium">Logo</p>
            <SelectorFoto
              nombre="logo"
              etiqueta={barberia.logo ? "Cambiar logo" : "Subir logo"}
              vistaPrevia={
                barberia.logo ? (
                  <Image src={barberia.logo} alt="" width={96} height={96} className="size-24 rounded-xl object-cover" />
                ) : (
                  <div className="grid size-24 place-items-center rounded-xl border border-dashed border-linea text-xs text-tenue">Sin logo</div>
                )
              }
            />
            {barberia.logo && (
              <label className="flex items-center gap-2 text-xs text-tenue">
                <input type="checkbox" name="quitar-logo" className="accent-[var(--cromo)]" /> Quitar logo
              </label>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Foto de portada</p>
            <SelectorFoto
              nombre="portada"
              etiqueta="Cambiar portada"
              vistaPrevia={
                barberia.portada ? (
                  <Image src={barberia.portada} alt="" width={96} height={96} className="size-24 rounded-xl object-cover" />
                ) : (
                  <div className="grid size-24 place-items-center rounded-xl border border-dashed border-linea text-xs text-tenue">Sin foto</div>
                )
              }
            />
            <p className="text-xs text-tenue">Mejor vertical: una foto de tu local o de un corte.</p>
          </div>
        </div>
      </section>

      <div className="sticky bottom-0 -mx-4 flex items-center gap-4 border-t border-linea bg-fondo/95 px-4 py-4 backdrop-blur">
        <Boton type="submit" disabled={pendiente}>
          {pendiente ? "Guardando..." : "Guardar cambios"}
        </Boton>
        <Mensaje estado={estado} />
      </div>
    </form>
  );
}
