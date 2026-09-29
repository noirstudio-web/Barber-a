"use client";

import { useState } from "react";
import { cancelarPlan } from "../../acciones";

// Cancelar pide confirmación y un motivo opcional
export function CancelarPlan({ id }: { id: number }) {
  const [abierto, setAbierto] = useState(false);
  if (!abierto) {
    return (
      <button type="button" onClick={() => setAbierto(true)} className="rounded-full px-3 py-1.5 text-xs text-peligro transition hover:bg-peligro/15">
        Cancelar plan
      </button>
    );
  }
  return (
    <form action={cancelarPlan.bind(null, id)} className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
      <input name="motivo" placeholder="Motivo (opcional)" maxLength={160} aria-label="Motivo de la cancelación" className="rounded-full border border-linea bg-superficie px-3 py-1.5 text-xs" />
      <button type="submit" className="rounded-full bg-peligro px-3 py-1.5 text-xs font-semibold text-fondo">
        Sí, cancelar
      </button>
      <button type="button" onClick={() => setAbierto(false)} className="px-2 py-1.5 text-xs text-tenue hover:text-texto">
        No
      </button>
    </form>
  );
}
