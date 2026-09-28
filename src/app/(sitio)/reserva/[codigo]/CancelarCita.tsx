"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cancelarReserva } from "../../reservar/acciones";

export function CancelarCita({ codigo }: { codigo: string }) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState(false);
  const [pendiente, iniciar] = useTransition();

  if (!confirmando) {
    return (
      <button type="button" onClick={() => setConfirmando(true)} className="text-sm text-tenue underline-offset-4 transition hover:text-texto hover:underline">
        Cancelar cita
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <span>¿Seguro que quieres cancelarla?</span>
      <button
        type="button"
        disabled={pendiente}
        onClick={() =>
          iniciar(async () => {
            const r = await cancelarReserva(codigo);
            if (r.ok) router.refresh();
            else setError(true);
          })
        }
        className="rounded-full bg-peligro/15 px-4 py-2 font-semibold text-peligro transition hover:bg-peligro/25 disabled:opacity-50"
      >
        {pendiente ? "Cancelando..." : "Sí, cancelar"}
      </button>
      <button type="button" onClick={() => setConfirmando(false)} className="px-2 py-2 text-tenue hover:text-texto">
        No
      </button>
      {error && <span className="w-full text-peligro">No se pudo cancelar. Escríbenos por WhatsApp.</span>}
    </div>
  );
}
