import { negocio } from "@/config/negocio";

// Fechas como texto "YYYY-MM-DD" en la hora local del negocio; horas como minutos desde medianoche.

export function ahoraLocal(): { fecha: string; minutos: number } {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: negocio.zonaHoraria,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const v = (t: string) => partes.find((p) => p.type === t)?.value ?? "00";
  return {
    fecha: `${v("year")}-${v("month")}-${v("day")}`,
    minutos: Number(v("hour")) * 60 + Number(v("minute")),
  };
}

function aUTC(fecha: string) {
  return new Date(`${fecha}T00:00:00Z`);
}

export function sumarDias(fecha: string, dias: number): string {
  const d = aUTC(fecha);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

export function diaSemana(fecha: string): number {
  return aUTC(fecha).getUTCDay();
}

// Lunes de la semana de la fecha dada
export function inicioSemana(fecha: string): string {
  const dia = diaSemana(fecha);
  return sumarDias(fecha, dia === 0 ? -6 : 1 - dia);
}

export function esFechaValida(fecha: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(fecha) && !Number.isNaN(aUTC(fecha).getTime()) && aUTC(fecha).toISOString().startsWith(fecha);
}

export function fmtHora(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${h < 12 ? "a. m." : "p. m."}`;
}

export function horaAMinutos(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m) return null;
  const total = Number(m[1]) * 60 + Number(m[2]);
  return total >= 0 && total <= 24 * 60 ? total : null;
}

export function minutosAHora(minutos: number): string {
  return `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;
}

export function fmtFecha(fecha: string, opciones: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" }): string {
  return new Intl.DateTimeFormat(negocio.locale, { ...opciones, timeZone: "UTC" }).format(aUTC(fecha));
}

export function fmtPrecio(valor: number): string {
  return new Intl.NumberFormat(negocio.locale, {
    style: "currency",
    currency: negocio.moneda,
    maximumFractionDigits: 0,
  }).format(valor);
}

export function fmtDuracion(minutos: number): string {
  if (minutos < 60) return `${minutos} min`;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
