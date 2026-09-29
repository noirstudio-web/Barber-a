"use client";

import { WhatsappLogoIcon } from "@phosphor-icons/react";
import { useTransition } from "react";
import type { EstadoCita } from "@/db/schema";
import { fmtHora } from "@/lib/tiempo";
import { enlaceWhatsApp, numeroInternacional, textoRecordatorioBarbero, textoRecordatorioCliente } from "@/lib/whatsapp";
import { cambiarEstadoCita } from "../acciones";
import { ESTILO_ESTADO } from "./estados";

export type CitaAgenda = {
  id: number;
  inicioMin: number;
  finMin: number;
  estado: EstadoCita;
  recordado: boolean;
  cliente: string;
  telefono: string;
  servicio: string;
};

const ACCIONES: { estado: EstadoCita; texto: string }[] = [
  { estado: "completada", texto: "Atendida" },
  { estado: "no_asistio", texto: "No asistió" },
  { estado: "cancelada", texto: "Cancelar" },
  { estado: "confirmada", texto: "Confirmada" },
];

export function CitaTarjeta({
  cita,
  barbero,
  fecha,
  estilo,
}: {
  cita: CitaAgenda;
  barbero: { nombre: string; telefono: string | null };
  fecha: string;
  estilo?: React.CSSProperties;
}) {
  const [pendiente, iniciar] = useTransition();
  const e = ESTILO_ESTADO[cita.estado];
  const duracion = cita.finMin - cita.inicioMin;
  const datos = { codigo: "", cliente: cita.cliente, telefono: cita.telefono, servicio: cita.servicio, barbero: barbero.nombre, fecha, hora: fmtHora(cita.inicioMin) };

  return (
    <details
      style={estilo}
      className={`group absolute inset-x-1 rounded-lg border-l-2 bg-superficie-2 text-xs open:z-30 open:ring-1 open:ring-cromo/40 ${e.borde} ${
        cita.estado === "cancelada" ? "opacity-45 open:opacity-100" : ""
      } ${pendiente ? "animate-pulse" : ""}`}
    >
      <summary className="h-full cursor-pointer list-none overflow-hidden px-2 py-0.5 leading-snug [&::-webkit-details-marker]:hidden">
        {duracion <= 15 ? (
          // Citas cortas: una sola línea para que quepan
          <span className="block truncate">
            <span className="font-semibold tabular-nums">{fmtHora(cita.inicioMin)}</span> {cita.cliente}
          </span>
        ) : (
          <>
            <span className="block font-semibold tabular-nums">
              {fmtHora(cita.inicioMin)} <span className="font-normal text-tenue">a {fmtHora(cita.finMin)}</span>
            </span>
            <span className={`block truncate ${cita.estado === "cancelada" ? "line-through" : ""}`}>{cita.cliente}</span>
            {duracion > 30 && <span className="block truncate text-tenue">{cita.servicio}</span>}
          </>
        )}
      </summary>
      {/* Panel flotante con las acciones, para no deformar la agenda */}
      <div className="absolute left-0 right-0 top-full mt-1 space-y-2 rounded-lg border border-linea bg-superficie-2 p-3 shadow-2xl shadow-black/70">
        <p className="font-semibold">{cita.cliente}</p>
        <p className="text-tenue">
          {cita.servicio}. {e.etiqueta}.
        </p>
        <div className="flex flex-wrap gap-1">
          {ACCIONES.filter((a) => a.estado !== cita.estado).map((a) => (
            <button
              key={a.estado}
              type="button"
              disabled={pendiente}
              onClick={() => iniciar(() => cambiarEstadoCita(cita.id, a.estado))}
              className="rounded-full border border-linea px-2.5 py-1 transition hover:bg-white/10"
            >
              {a.texto}
            </button>
          ))}
        </div>
        {cita.estado === "confirmada" && (
          <div className="space-y-1 border-t border-linea pt-2">
            <p className="text-tenue">{cita.recordado ? "Recordatorio automático enviado" : "Recordar por WhatsApp"}</p>
            <div className="flex flex-wrap gap-1">
              <a
                href={enlaceWhatsApp(textoRecordatorioCliente(datos), numeroInternacional(cita.telefono))}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-linea px-2.5 py-1 transition hover:bg-white/10"
              >
                <WhatsappLogoIcon size={14} /> Al cliente
              </a>
              {barbero.telefono && (
                <a
                  href={enlaceWhatsApp(textoRecordatorioBarbero(datos), numeroInternacional(barbero.telefono))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full border border-linea px-2.5 py-1 transition hover:bg-white/10"
                >
                  <WhatsappLogoIcon size={14} /> Al barbero
                </a>
              )}
            </div>
          </div>
        )}
        <a
          href={enlaceWhatsApp(undefined, numeroInternacional(cita.telefono))}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-tenue hover:text-texto"
        >
          <WhatsappLogoIcon size={14} /> {cita.telefono}
        </a>
      </div>
    </details>
  );
}
