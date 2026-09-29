// Ajustes comunes a todas las barberías de la plataforma (por ahora, todas en Colombia).

export const region = {
  zonaHoraria: "America/Bogota",
  moneda: "COP",
  locale: "es-CO",
  // Indicativo que se antepone a los celulares locales para escribir por WhatsApp
  indicativo: "57",
};

export const reglasReserva = {
  // Cada cuántos minutos se ofrece una hora de inicio
  intervaloMin: 15,
  // Tiempo mínimo entre "ahora" y la cita
  antelacionMin: 60,
  // Hasta cuántos días hacia adelante se puede reservar
  diasMaximos: 30,
  // Minutos antes de la cita en que se envía el recordatorio por WhatsApp
  recordatorioMin: 120,
};

export const nombresDias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

// Horario de atención. 0 = domingo ... 6 = sábado. null = cerrado. Minutos desde medianoche.
export type Horario = Record<string, { abre: number; cierra: number } | null>;

export const horarioPorDefecto: Horario = {
  0: null,
  1: { abre: 9 * 60, cierra: 19 * 60 },
  2: { abre: 9 * 60, cierra: 19 * 60 },
  3: { abre: 9 * 60, cierra: 19 * 60 },
  4: { abre: 9 * 60, cierra: 19 * 60 },
  5: { abre: 9 * 60, cierra: 20 * 60 },
  6: { abre: 9 * 60, cierra: 17 * 60 },
};
