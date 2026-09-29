import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { barberos } from "@/db/schema";
import { FormularioBarbero } from "./FormularioBarbero";

export const dynamic = "force-dynamic";

export default async function PaginaBarberos() {
  const db = await getDb();
  const lista = await db.select().from(barberos).orderBy(asc(barberos.orden), asc(barberos.id));

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold">Barberos</h1>
      <p className="mt-1 text-sm text-tenue">
        El celular se usa para avisarle a cada barbero por WhatsApp cuando le reservan y 2 horas antes de cada cita.
      </p>
      <div className="mt-8 space-y-3">
        {lista.map((b) => (
          <FormularioBarbero key={b.id} barbero={b} />
        ))}
      </div>
    </div>
  );
}
