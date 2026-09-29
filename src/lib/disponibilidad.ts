import { and, asc, eq, gte, lte, ne } from "drizzle-orm";
import { reglasReserva as reservas, type Horario } from "@/config/region";
import type { Db } from "@/db";
import { barberos, bloqueos, citas, servicios } from "@/db/schema";
import { ahoraLocal, diaSemana, sumarDias } from "./tiempo";

// Sirve tanto la conexión como una transacción
type Consultable = Pick<Db, "select">;

export type Hueco = { inicio: number; barberos: number[] };
export type Disponibilidad = Record<string, Hueco[]>;

type Rango = { inicio: number; fin: number };

// Horas de inicio libres para un barbero en un día, dadas sus ocupaciones.
export function huecosLibres(
  jornada: { abre: number; cierra: number },
  duracion: number,
  ocupado: Rango[],
  minimo: number,
): number[] {
  const libres: number[] = [];
  const paso = reservas.intervaloMin;
  const primero = Math.max(jornada.abre, Math.ceil(minimo / paso) * paso);
  for (let inicio = primero; inicio + duracion <= jornada.cierra; inicio += paso) {
    const fin = inicio + duracion;
    if (!ocupado.some((o) => inicio < o.fin && fin > o.inicio)) libres.push(inicio);
  }
  return libres;
}

// Calcula los huecos por día entre desde y hasta (incluidos).
// barberoId null = cualquier barbero; cada hueco dice qué barberos están libres.
export async function calcularDisponibilidad(
  db: Consultable,
  opts: { barberiaId: number; horario: Horario; servicioId: number; barberoId: number | null; desde: string; hasta: string },
): Promise<Disponibilidad> {
  const [servicio] = await db.select().from(servicios).where(and(eq(servicios.id, opts.servicioId), eq(servicios.barberiaId, opts.barberiaId), eq(servicios.activo, true)));
  if (!servicio) return {};

  const equipo = await db
    .select({ id: barberos.id })
    .from(barberos)
    .where(
      and(
        eq(barberos.barberiaId, opts.barberiaId),
        eq(barberos.activo, true),
        opts.barberoId ? eq(barberos.id, opts.barberoId) : undefined,
      ),
    )
    .orderBy(asc(barberos.orden));
  if (equipo.length === 0) return {};

  const [ocupadas, bloqueados] = await Promise.all([
    db
      .select({ barberoId: citas.barberoId, fecha: citas.fecha, inicio: citas.inicioMin, fin: citas.finMin })
      .from(citas)
      .where(
        and(
          eq(citas.barberiaId, opts.barberiaId),
          gte(citas.fecha, opts.desde),
          lte(citas.fecha, opts.hasta),
          ne(citas.estado, "cancelada"),
        ),
      ),
    db
      .select()
      .from(bloqueos)
      .where(and(eq(bloqueos.barberiaId, opts.barberiaId), lte(bloqueos.desde, opts.hasta), gte(bloqueos.hasta, opts.desde))),
  ]);

  const ahora = ahoraLocal();
  const limite = sumarDias(ahora.fecha, reservas.diasMaximos);
  const resultado: Disponibilidad = {};

  for (let fecha = opts.desde; fecha <= opts.hasta; fecha = sumarDias(fecha, 1)) {
    const jornada = opts.horario[diaSemana(fecha)];
    if (!jornada || fecha < ahora.fecha || fecha > limite) {
      resultado[fecha] = [];
      continue;
    }
    const minimo = fecha === ahora.fecha ? ahora.minutos + reservas.antelacionMin : 0;
    const porHora = new Map<number, number[]>();

    for (const { id } of equipo) {
      const ocupado: Rango[] = [
        ...ocupadas.filter((c) => c.barberoId === id && c.fecha === fecha),
        ...bloqueados
          .filter((b) => (b.barberoId === null || b.barberoId === id) && b.desde <= fecha && b.hasta >= fecha)
          .map((b) => ({ inicio: b.inicioMin ?? 0, fin: b.finMin ?? 24 * 60 })),
      ];
      for (const inicio of huecosLibres(jornada, servicio.duracionMin, ocupado, minimo)) {
        porHora.set(inicio, [...(porHora.get(inicio) ?? []), id]);
      }
    }

    resultado[fecha] = [...porHora.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([inicio, ids]) => ({ inicio, barberos: ids }));
  }
  return resultado;
}
