"use client";

import { useActionState, useState } from "react";
import { Campo, claseCampo, Entrada, Mensaje } from "@/components/admin/Campo";
import { Boton } from "@/components/sitio/Boton";
import { crearBloqueo } from "../../acciones";

export function FormularioBloqueo({ equipo, hoy }: { equipo: { id: number; nombre: string }[]; hoy: string }) {
  const [estado, accion, pendiente] = useActionState(crearBloqueo, {});
  const [diaCompleto, setDiaCompleto] = useState(false);

  return (
    <form action={accion} className="mt-6 space-y-5 rounded-2xl border border-linea p-5 sm:p-6">
      <Campo etiqueta="¿A quién aplica?" id="barberoId">
        <select id="barberoId" name="barberoId" className={claseCampo}>
          <option value="">Toda la barbería</option>
          {equipo.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nombre}
            </option>
          ))}
        </select>
      </Campo>
      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Desde" id="desde">
          <Entrada id="desde" name="desde" type="date" required min={hoy} defaultValue={hoy} />
        </Campo>
        <Campo etiqueta="Hasta" id="hasta" ayuda="Vacío = un solo día">
          <Entrada id="hasta" name="hasta" type="date" min={hoy} />
        </Campo>
      </div>
      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" name="diaCompleto" checked={diaCompleto} onChange={(e) => setDiaCompleto(e.target.checked)} className="size-4 accent-[var(--cromo)]" />
        Todo el día
      </label>
      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Hora inicio" id="horaInicio">
          <Entrada id="horaInicio" name="horaInicio" type="time" step={900} defaultValue="13:00" disabled={diaCompleto} required={!diaCompleto} />
        </Campo>
        <Campo etiqueta="Hora fin" id="horaFin">
          <Entrada id="horaFin" name="horaFin" type="time" step={900} defaultValue="14:00" disabled={diaCompleto} required={!diaCompleto} />
        </Campo>
      </div>
      <Campo etiqueta="Motivo (opcional)" id="motivo">
        <Entrada id="motivo" name="motivo" maxLength={80} placeholder="Almuerzo, vacaciones, capacitación..." />
      </Campo>
      <div className="flex items-center gap-4">
        <Boton type="submit" disabled={pendiente}>
          {pendiente ? "Guardando..." : "Bloquear"}
        </Boton>
        <Mensaje estado={estado} />
      </div>
    </form>
  );
}
