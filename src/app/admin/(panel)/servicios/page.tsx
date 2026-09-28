import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { servicios } from "@/db/schema";
import { FormularioServicio } from "./FormularioServicio";

export const dynamic = "force-dynamic";

export default async function PaginaServicios() {
  const db = await getDb();
  const lista = await db.select().from(servicios).orderBy(asc(servicios.orden), asc(servicios.id));

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold">Servicios y precios</h1>
      <p className="mt-1 text-sm text-tenue">Los cambios se ven al instante en la web. Un servicio oculto no se puede reservar.</p>
      <div className="mt-8 space-y-3">
        {lista.map((s) => (
          <FormularioServicio key={s.id} servicio={s} />
        ))}
      </div>
      <h2 className="mt-12 text-lg font-semibold">Agregar servicio</h2>
      <div className="mt-4">
        <FormularioServicio servicio={null} />
      </div>
    </div>
  );
}
