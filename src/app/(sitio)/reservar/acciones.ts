"use server";

import { randomInt } from "node:crypto";
import { and, eq, gt, ne, or, sql } from "drizzle-orm";
import { after } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { barberos, citas, clientes, servicios } from "@/db/schema";
import { calcularDisponibilidad } from "@/lib/disponibilidad";
import { ahoraLocal, esFechaValida, fmtFecha, fmtHora } from "@/lib/tiempo";
import { enviarAvisoNuevaCita } from "@/lib/whatsapp";

const esquema = z.object({
  servicioId: z.number().int().positive(),
  barberoId: z.number().int().positive().nullable(),
  fecha: z.string().refine(esFechaValida),
  inicio: z.number().int().min(0).max(24 * 60),
  nombre: z.string().trim().min(2, "Escribe tu nombre").max(60),
  telefono: z
    .string()
    .transform((t) => t.replace(/[^\d]/g, ""))
    .refine((t) => t.length >= 7 && t.length <= 15, "Escribe un teléfono válido"),
});

export type DatosReserva = z.input<typeof esquema>;
export type ResultadoReserva = { ok: true; codigo: string } | { ok: false; error: string; horaOcupada?: boolean };

function nuevoCodigo() {
  const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => letras[randomInt(letras.length)]).join("");
}

export async function reservar(datos: DatosReserva): Promise<ResultadoReserva> {
  const parsed = esquema.safeParse(datos);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Revisa los datos" };
  const d = parsed.data;
  const db = await getDb();

  const resultado = await db.transaction(async (tx) => {
    // Un candado por día evita que dos personas reserven la misma hora a la vez
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${"citas:" + d.fecha}))`);

    const dispo = await calcularDisponibilidad(tx, {
      servicioId: d.servicioId,
      barberoId: d.barberoId,
      desde: d.fecha,
      hasta: d.fecha,
    });
    const hueco = dispo[d.fecha]?.find((h) => h.inicio === d.inicio);
    if (!hueco) return null;

    let barberoId = hueco.barberos[0];
    if (d.barberoId === null && hueco.barberos.length > 1) {
      // "El que esté disponible": se asigna al barbero con menos citas ese día
      const cargas = await tx
        .select({ barberoId: citas.barberoId, total: sql<number>`count(*)::int` })
        .from(citas)
        .where(and(eq(citas.fecha, d.fecha), ne(citas.estado, "cancelada")))
        .groupBy(citas.barberoId);
      const carga = (id: number) => cargas.find((c) => c.barberoId === id)?.total ?? 0;
      barberoId = [...hueco.barberos].sort((a, b) => carga(a) - carga(b))[0];
    }

    const [servicio] = await tx.select().from(servicios).where(eq(servicios.id, d.servicioId));
    const [barbero] = await tx.select().from(barberos).where(eq(barberos.id, barberoId));

    const [cliente] = await tx
      .insert(clientes)
      .values({ nombre: d.nombre, telefono: d.telefono })
      .onConflictDoUpdate({ target: clientes.telefono, set: { nombre: d.nombre } })
      .returning();

    const codigo = nuevoCodigo();
    await tx.insert(citas).values({
      codigo,
      clienteId: cliente.id,
      barberoId,
      servicioId: servicio.id,
      fecha: d.fecha,
      inicioMin: d.inicio,
      finMin: d.inicio + servicio.duracionMin,
      precio: servicio.precio,
    });
    return { codigo, servicio: servicio.nombre, barbero: barbero.nombre, telefonoBarbero: barbero.telefono };
  });

  if (!resultado) {
    return { ok: false, error: "Esa hora acaba de ocuparse. Elige otra, por favor.", horaOcupada: true };
  }

  // El aviso sale después de responder, para no demorar la confirmación
  after(() =>
    enviarAvisoNuevaCita(
      {
        codigo: resultado.codigo,
        cliente: d.nombre,
        telefono: d.telefono,
        servicio: resultado.servicio,
        barbero: resultado.barbero,
        fecha: fmtFecha(d.fecha),
        hora: fmtHora(d.inicio),
      },
      resultado.telefonoBarbero,
    ),
  );

  return { ok: true, codigo: resultado.codigo };
}

export async function cancelarReserva(codigo: string): Promise<{ ok: boolean }> {
  const db = await getDb();
  const ahora = ahoraLocal();
  // Solo citas confirmadas que todavía no han empezado
  const filas = await db
    .update(citas)
    .set({ estado: "cancelada" })
    .where(
      and(
        eq(citas.codigo, codigo),
        eq(citas.estado, "confirmada"),
        or(gt(citas.fecha, ahora.fecha), and(eq(citas.fecha, ahora.fecha), gt(citas.inicioMin, ahora.minutos))),
      ),
    )
    .returning({ id: citas.id });
  return { ok: filas.length > 0 };
}
