import type { EstadoCita } from "@/db/schema";

export const ESTILO_ESTADO: Record<EstadoCita, { borde: string; etiqueta: string }> = {
  confirmada: { borde: "border-cromo", etiqueta: "Confirmada" },
  completada: { borde: "border-exito", etiqueta: "Atendida" },
  no_asistio: { borde: "border-peligro", etiqueta: "No asistió" },
  cancelada: { borde: "border-white/20", etiqueta: "Cancelada" },
};
