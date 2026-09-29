import { NextResponse } from "next/server";
import { limitesPlan } from "@/lib/barberias";
import { listarClientes } from "@/lib/clientes";
import { exigirPanel } from "@/lib/sesion";

export const dynamic = "force-dynamic";

// Descarga de clientes en CSV. Excel lo abre directo (separador ";" y BOM para las tildes).
export async function GET() {
  const { barberia } = await exigirPanel();
  if (!limitesPlan(barberia).herramientasPremium) {
    return NextResponse.json({ error: "Disponible en el plan Premium" }, { status: 403 });
  }
  const lista = await listarClientes(barberia.id, { limite: 100_000 });
  const celda = (v: string | number | null) => {
    const t = String(v ?? "");
    return /[";\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const filas = [
    ["Nombre", "Celular", "Visitas", "Última visita", "Próxima cita", "Faltas", "Total gastado"],
    ...lista.map((c) => [c.nombre, c.telefono, c.visitas, c.ultima, c.proxima, c.faltas, c.gastado]),
  ];
  const csv = "﻿" + filas.map((f) => f.map(celda).join(";")).join("\r\n");
  const fecha = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clientes-${barberia.slug}-${fecha}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
