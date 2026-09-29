import { and, eq, gt, inArray, isNull, lte, or } from "drizzle-orm";
import { reglasReserva as reservas } from "@/config/region";
import type { Db } from "@/db";
import { barberias, barberos, citas, clientes, servicios } from "@/db/schema";
import { estadoSuscripcion, limitesPlan } from "./barberias";
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
      barberia: barberias,
    })
    .from(citas)
    .innerJoin(barberias, eq(citas.barberiaId, barberias.id))
    .innerJoin(clientes, eq(citas.clienteId, clientes.id))
    .innerJoin(servicios, eq(citas.servicioId, servicios.id))
    .innerJoin(barberos, eq(citas.barberoId, barberos.id))
    .where(inArray(citas.id, ids));

  // Solo las barberías activas con un plan que incluye recordatorios automáticos
  const aEnviar = filas.filter((f) => estadoSuscripcion(f.barberia).activa && limitesPlan(f.barberia).recordatoriosAutomaticos);

  await Promise.all(
    aEnviar.map((f) =>
      enviarRecordatorios(
        {
          negocio: { nombre: f.barberia.nombre, direccion: f.barberia.direccion, whatsapp: f.barberia.whatsapp },
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
  return { enviados: aEnviar.length, configurado: true };
}
