import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { barberos } from "@/db/schema";
import { limitesPlan } from "@/lib/barberias";
import { exigirPanel } from "@/lib/sesion";
import { FormularioBarbero } from "./FormularioBarbero";

export const dynamic = "force-dynamic";

export default async function PaginaBarberos() {
  const { barberia } = await exigirPanel();
  const db = await getDb();
  const lista = await db.select().from(barberos).where(eq(barberos.barberiaId, barberia.id)).orderBy(asc(barberos.orden), asc(barberos.id));
  const max = limitesPlan(barberia).maxBarberos;
  const activos = lista.filter((b) => b.activo).length;

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold">Barberos</h1>
      <p className="mt-1 text-sm text-tenue">
        Aparecen en tu web y en las reservas. El celular se usa para avisarle a cada uno por WhatsApp.
        {max !== null && ` Tu plan permite ${max} barberos activos (tienes ${activos}).`}
      </p>
      <div className="mt-8 space-y-3">
        {lista.map((b) => (
          <FormularioBarbero key={b.id} barbero={b} />
        ))}
      </div>
      <h2 className="mt-12 text-lg font-semibold">Agregar barbero</h2>
      <div className="mt-4">
        {max !== null && activos >= max ? (
          <p className="rounded-2xl border border-dashed border-linea px-6 py-8 text-sm text-tenue">
            Llegaste al límite de tu plan. Oculta un barbero o pásate a Premium para tener barberos ilimitados.
          </p>
        ) : (
          <FormularioBarbero barbero={null} />
        )}
      </div>
    </div>
  );
}
