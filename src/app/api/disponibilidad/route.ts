import { NextResponse, type NextRequest } from "next/server";
import { reservas } from "@/config/negocio";
import { getDb } from "@/db";
import { calcularDisponibilidad } from "@/lib/disponibilidad";
import { ahoraLocal, sumarDias } from "@/lib/tiempo";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const servicioId = Number(req.nextUrl.searchParams.get("servicio"));
  const barbero = req.nextUrl.searchParams.get("barbero");
  const barberoId = barbero && barbero !== "cualquiera" ? Number(barbero) : null;
  if (!Number.isInteger(servicioId) || servicioId <= 0 || (barberoId !== null && !Number.isInteger(barberoId))) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const hoy = ahoraLocal().fecha;
  const db = await getDb();
  const dias = await calcularDisponibilidad(db, {
    servicioId,
    barberoId,
    desde: hoy,
    hasta: sumarDias(hoy, reservas.diasMaximos),
  });
  return NextResponse.json({ hoy, dias }, { headers: { "Cache-Control": "no-store" } });
}
