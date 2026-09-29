import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { usuarios } from "@/db/schema";
import { exigirNoir } from "@/lib/sesion";
import { FormularioClave } from "../../../admin/(panel)/cuenta/FormularioClave";
import { eliminarUsuarioNoir } from "../../acciones";
import { FormularioEquipoNoir } from "./FormularioEquipoNoir";

export const dynamic = "force-dynamic";

export default async function CuentaNoir() {
  const yo = await exigirNoir();
  const db = await getDb();
  const equipo = await db.select().from(usuarios).where(eq(usuarios.rol, "noir")).orderBy(asc(usuarios.creadoEn));

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <section className="lg:col-span-5">
        <h1 className="text-2xl font-semibold">Mi cuenta</h1>
        <p className="mt-1 text-sm text-tenue">
          {yo.nombre}, usuario <span className="text-texto">{yo.usuario}</span>
        </p>
        <h2 className="mt-8 text-lg font-semibold">Cambiar contraseña</h2>
        <FormularioClave />
      </section>

      <section className="lg:col-span-7">
        <h2 className="text-lg font-semibold">Administradores de la plataforma</h2>
        <p className="mt-1 text-sm text-tenue">
          Solo estas personas entran a este panel. El registro público está cerrado: las cuentas nuevas se crean aquí.
        </p>
        <ul className="mt-4 space-y-2">
          {equipo.map((u) => (
            <li key={u.id} className="flex items-center justify-between gap-3 rounded-xl bg-superficie px-4 py-3 text-sm">
              <span>
                <span className="font-semibold">{u.nombre}</span> <span className="text-tenue">({u.usuario})</span>
                {u.id === yo.id && <span className="text-tenue"> tú</span>}
              </span>
              {u.id !== yo.id && (
                <form action={eliminarUsuarioNoir.bind(null, u.id)}>
                  <button type="submit" className="rounded-full px-3 py-1.5 text-xs text-peligro transition hover:bg-peligro/15">
                    Quitar acceso
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
        <FormularioEquipoNoir />
      </section>
    </div>
  );
}
