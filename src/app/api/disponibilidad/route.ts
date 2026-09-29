import { NextResponse, type NextRequest } from "next/server";
import { reglasReserva } from "@/config/region";
import { getDb } from "@/db";
import { barberiaPorSlug, estadoSuscripcion } from "@/lib/barberias";
import { calcularDisponibilidad } from "@/lib/disponibilidad";
import { ahoraLocal, sumarDias } from "@/lib/tiempo";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("barberia") ?? "";
  const servicioId = Number(req.nextUrl.searchParams.get("servicio"));
  const barbero = req.nextUrl.searchParams.get("barbero");
  const barberoId = barbero && barbero !== "cualquiera" ? Number(barbero) : null;
  if (!slug || !Number.isInteger(servicioId) || servicioId <= 0 || (barberoId !== null && !Number.isInteger(barberoId))) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }
  const negocio = await barberiaPorSlug(slug);
  if (!negocio || !estadoSuscripcion(negocio).activa) {
    return NextResponse.json({ error: "Barbería no disponible" }, { status: 404 });
  }

  const hoy = ahoraLocal().fecha;
  const db = await getDb();
  const dias = await calcularDisponibilidad(db, {
    barberiaId: negocio.id,
    horario: negocio.horario,
    servicioId,
    barberoId,
    desde: hoy,
    hasta: sumarDias(hoy, reglasReserva.diasMaximos),
  });
  return NextResponse.json({ hoy, dias }, { headers: { "Cache-Control": "no-store" } });
}
