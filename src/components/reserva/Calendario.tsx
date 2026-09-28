"use client";

import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { fmtFecha } from "@/lib/tiempo";

const CABECERA = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

function mesDe(fecha: string) {
  return fecha.slice(0, 7);
}

function sumarMes(mes: string, n: number) {
  const [a, m] = mes.split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}

// Calendario mensual: solo se pueden tocar los días con horas libres.
export function Calendario({
  hoy,
  ultimo,
  habilitados,
  seleccion,
  alElegir,
}: {
  hoy: string;
  ultimo: string;
  habilitados: Set<string>;
  seleccion: string | null;
  alElegir: (fecha: string) => void;
}) {
  const [mes, setMes] = useState(mesDe(seleccion ?? hoy));
  const [a, m] = mes.split("-").map(Number);
  const primerDia = new Date(Date.UTC(a, m - 1, 1));
  const diasEnMes = new Date(Date.UTC(a, m, 0)).getUTCDate();
  const desfase = (primerDia.getUTCDay() + 6) % 7;
  const celdas: (string | null)[] = [
    ...Array.from({ length: desfase }, () => null),
    ...Array.from({ length: diasEnMes }, (_, i) => `${mes}-${String(i + 1).padStart(2, "0")}`),
  ];

  const puedeAtras = mes > mesDe(hoy);
  const puedeAdelante = mes < mesDe(ultimo);
  const titulo = fmtFecha(`${mes}-01`, { month: "long", year: "numeric" });

  return (
    <div className="rounded-2xl bg-superficie p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-semibold capitalize">{titulo}</p>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setMes(sumarMes(mes, -1))}
            disabled={!puedeAtras}
            aria-label="Mes anterior"
            className="grid size-9 place-items-center rounded-full border border-linea transition hover:bg-white/5 disabled:opacity-30"
          >
            <CaretLeftIcon size={16} />
          </button>
          <button
            type="button"
            onClick={() => setMes(sumarMes(mes, 1))}
            disabled={!puedeAdelante}
            aria-label="Mes siguiente"
            className="grid size-9 place-items-center rounded-full border border-linea transition hover:bg-white/5 disabled:opacity-30"
          >
            <CaretRightIcon size={16} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {CABECERA.map((d) => (
          <span key={d} className="pb-2 text-xs text-tenue">
            {d}
          </span>
        ))}
        {celdas.map((fecha, i) => {
          if (!fecha) return <span key={`v${i}`} />;
          const activo = habilitados.has(fecha);
          const elegido = fecha === seleccion;
          return (
            <button
              key={fecha}
              type="button"
              disabled={!activo}
              onClick={() => alElegir(fecha)}
              aria-pressed={elegido}
              aria-label={fmtFecha(fecha)}
              className={`relative aspect-square rounded-xl text-sm tabular-nums transition ${
                elegido
                  ? "bg-cromo font-semibold text-fondo"
                  : activo
                    ? "bg-white/[0.04] hover:bg-white/10"
                    : "text-tenue/40"
              }`}
            >
              {Number(fecha.slice(8))}
              {fecha === hoy && !elegido && <span className="absolute inset-x-0 bottom-1.5 mx-auto size-1 rounded-full bg-cromo" aria-hidden />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
