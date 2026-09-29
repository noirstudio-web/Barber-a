import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/db";
import { procesarRecordatorios } from "@/lib/recordatorios";

export const dynamic = "force-dynamic";

// Lo llama el cron de Vercel. Vercel envía "Authorization: Bearer <CRON_SECRET>".
export async function GET(req: NextRequest) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || req.headers.get("authorization") !== `Bearer ${secreto}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const resultado = await procesarRecordatorios(await getDb());
  return NextResponse.json(resultado);
}
