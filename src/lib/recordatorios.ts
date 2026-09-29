import { and, eq, gt, inArray, isNull, lte, or } from "drizzle-orm";
import { reservas } from "@/config/negocio";
import type { Db } from "@/db";
import { barberos, citas, clientes, servicios } from "@/db/schema";
import { ahoraLocal, fmtFecha, fmtHora, sumarDias } from "./tiempo";
import { enviarRecordatorios, whatsappConfigurado } from "./whatsapp";

// Busca las citas confirmadas que empiezan dentro de los próximos `recordatorioMin` minutos,
// las marca como recordadas y envía el WhatsApp al cliente y al barbero.
// Se ejecuta cada pocos minutos desde el cron de Vercel (ver vercel.json).
export async function procesarRecordatorios(db: Db): Promise<{ enviados: number; configurado: boolean }> {
  if (!whatsappConfigurado()) return { enviados: 0, configurado: false };

  const ahora = ahoraLocal();
  const limite = ahora.minutos + reservas.recordatorioMin;
  // Ventana que puede pasar de medianoche
  const ventana =
    limite < 24 * 60
      ? and(eq(citas.fecha, ahora.fecha), gt(citas.inicioMin, ahora.minutos), lte(citas.inicioMin, limite))
      : or(
          and(eq(citas.fecha, ahora.fecha), gt(citas.inicioMin, ahora.minutos)),
          and(eq(citas.fecha, sumarDias(ahora.fecha, 1)), lte(citas.inicioMin, limite - 24 * 60)),
        );

  // Marcar primero evita enviar dos veces si dos ejecuciones coinciden
  const marcadas = await db
    .update(citas)
    .set({ recordatorioEnviado: new Date() })
    .where(and(eq(citas.estado, "confirmada"), isNull(citas.recordatorioEnviado), ventana))
    .returning({ id: citas.id, creadoEn: citas.creadoEn });

  // Si la reservaron hace muy poco, ya tienen la confirmación fresca: no hace falta recordar
  const hace15 = Date.now() - 15 * 60 * 1000;
  const ids = marcadas.filter((c) => c.creadoEn.getTime() < hace15).map((c) => c.id);
  if (ids.length === 0) return { enviados: 0, configurado: true };

  const filas = await db
    .select({
      codigo: citas.codigo,
      fecha: citas.fecha,
      inicioMin: citas.inicioMin,
      cliente: clientes.nombre,
      telefono: clientes.telefono,
      servicio: servicios.nombre,
      barbero: barberos.nombre,
      telefonoBarbero: barberos.telefono,
    })
    .from(citas)
    .innerJoin(clientes, eq(citas.clienteId, clientes.id))
    .innerJoin(servicios, eq(citas.servicioId, servicios.id))
    .innerJoin(barberos, eq(citas.barberoId, barberos.id))
    .where(inArray(citas.id, ids));

  await Promise.all(
    filas.map((f) =>
      enviarRecordatorios(
        {
          codigo: f.codigo,
          cliente: f.cliente,
          telefono: f.telefono,
          servicio: f.servicio,
          barbero: f.barbero,
          fecha: fmtFecha(f.fecha),
          hora: fmtHora(f.inicioMin),
        },
        f.telefonoBarbero,
      ),
    ),
  );
  return { enviados: filas.length, configurado: true };
}
