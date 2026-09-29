import { and, asc, count, desc, eq, gt, sql } from "drizzle-orm";
import { noir } from "@/config/noir";
import { planes } from "@/config/planes";
import { region } from "@/config/region";
import { getDb } from "@/db";
import { barberias, citas, usuarios, type Barberia } from "@/db/schema";
import { estadoSuscripcion, type EstadoSuscripcion } from "./barberias";
import { enlaceWhatsApp } from "./whatsapp";

export type FilaBarberia = {
  b: Barberia;
  dueno: { nombre: string; usuario: string } | null;
  citasMes: number;
  estado: EstadoSuscripcion;
  esDemo: boolean;
  // Activa y vence en 7 días o menos
  porVencer: boolean;
};

// Todas las barberías con su dueño, actividad de los últimos 30 días y estado de suscripción
export async function listarBarberias(): Promise<FilaBarberia[]> {
  const db = await getDb();
  const [lista, duenos, conteos] = await Promise.all([
    db.select().from(barberias).orderBy(desc(barberias.creadoEn)),
    db
      .select({ barberiaId: usuarios.barberiaId, nombre: usuarios.nombre, usuario: usuarios.usuario })
      .from(usuarios)
      .where(eq(usuarios.rol, "dueno"))
      .orderBy(asc(usuarios.id)),
    db
      .select({ barberiaId: citas.barberiaId, total: count() })
      .from(citas)
      .where(and(gt(citas.creadoEn, sql`now() - interval '30 days'`)))
      .groupBy(citas.barberiaId),
  ]);
  return lista.map((b) => {
    const estado = estadoSuscripcion(b);
    const d = duenos.find((x) => x.barberiaId === b.id);
    return {
      b,
      dueno: d ? { nombre: d.nombre, usuario: d.usuario } : null,
      citasMes: conteos.find((c) => c.barberiaId === b.id)?.total ?? 0,
      estado,
      esDemo: b.slug === noir.demo,
      porVencer: estado.activa && estado.diasRestantes <= 7,
    };
  });
}

export function fechaLarga(d: Date) {
  return new Intl.DateTimeFormat(region.locale, { day: "numeric", month: "long", year: "numeric", timeZone: region.zonaHoraria }).format(d);
}

export function fechaCorta(d: Date) {
  return new Intl.DateTimeFormat(region.locale, { day: "numeric", month: "short", timeZone: region.zonaHoraria }).format(d);
}

export function fmtUsd(centavos: number) {
  const usd = centavos / 100;
  return `${Number.isInteger(usd) ? usd : usd.toFixed(2)} USD`;
}

export function etiquetaEstado(f: Pick<FilaBarberia, "b" | "estado" | "porVencer">) {
  if (f.estado.motivo === "cancelada") return { texto: "Cancelada", clase: "bg-peligro/15 text-peligro" };
  if (f.estado.motivo === "suspendida") return { texto: "Suspendida", clase: "bg-peligro/15 text-peligro" };
  if (f.estado.motivo === "vencida") return { texto: "Vencida", clase: "bg-peligro/15 text-peligro" };
  if (f.porVencer) return { texto: `${planes[f.b.plan].nombre}, vence pronto`, clase: "bg-amber-400/15 text-amber-300" };
  if (f.b.plan === "prueba") return { texto: "Prueba", clase: "bg-white/10 text-texto" };
  return { texto: planes[f.b.plan].nombre, clase: "bg-exito/15 text-exito" };
}

// Mensaje de WhatsApp al dueño para recordarle que renueve
export function enlaceRecordarRenovacion(f: FilaBarberia) {
  if (!f.b.whatsapp) return null;
  const plan = f.b.plan === "prueba" ? planes.premium : planes[f.b.plan];
  const saludo = f.dueno ? `Hola ${f.dueno.nombre.split(" ")[0]}` : "Hola";
  const cuando = f.estado.activa
    ? `vence el ${fechaLarga(f.b.venceEn)}`
    : `venció el ${fechaLarga(f.b.venceEn)} y tu web está en pausa`;
  const texto =
    f.b.plan === "prueba"
      ? `${saludo}, tu prueba gratis de ${f.b.nombre} ${cuando}. Para seguir recibiendo reservas, el plan ${plan.nombre} cuesta ${plan.precioUsd} USD al mes. ¿Te envío los datos de pago?`
      : `${saludo}, tu plan ${plan.nombre} de ${f.b.nombre} ${cuando}. La renovación son ${plan.precioUsd} USD. ¿Te envío los datos de pago?`;
  return enlaceWhatsApp(texto, f.b.whatsapp);
}
