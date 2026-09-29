import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { usuarios } from "@/db/schema";
import { exigirAdmin } from "@/lib/sesion";
import { fmtFecha } from "@/lib/tiempo";
import { eliminarUsuario, hacerDueno } from "../../acciones";
import { FormularioClave } from "./FormularioClave";

export const dynamic = "force-dynamic";

export default async function PaginaCuenta() {
  const yo = await exigirAdmin();
  const db = await getDb();
  const equipo = yo.rol === "dueno" ? await db.select().from(usuarios).orderBy(asc(usuarios.creadoEn)) : [];

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <section className="lg:col-span-5">
        <h1 className="text-2xl font-semibold">Mi cuenta</h1>
        <p className="mt-1 text-sm text-tenue">
          {yo.nombre}, usuario <span className="text-texto">{yo.usuario}</span> ({yo.rol === "dueno" ? "dueño" : "equipo"})
        </p>
        <h2 className="mt-8 text-lg font-semibold">Cambiar contraseña</h2>
        <FormularioClave />
      </section>

      {yo.rol === "dueno" && (
        <section className="lg:col-span-7">
          <h2 className="text-lg font-semibold">Usuarios del panel</h2>
          <p className="mt-1 text-sm text-tenue">
            Cada persona crea su usuario en <span className="text-texto">/admin/registro</span> con el código del negocio.
          </p>
          <ul className="mt-4 space-y-2">
            {equipo.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-superficie px-4 py-3 text-sm">
                <div>
                  <p className="font-semibold">
                    {u.nombre} {u.id === yo.id && <span className="font-normal text-tenue">(tú)</span>}
                  </p>
                  <p className="text-tenue">
                    {u.usuario}, {u.rol === "dueno" ? "dueño" : "equipo"}, desde el {fmtFecha(u.creadoEn.toISOString().slice(0, 10), { day: "numeric", month: "short" })}
                  </p>
                </div>
                {u.rol !== "dueno" && (
                  <div className="flex gap-2">
                    <form action={hacerDueno.bind(null, u.id)}>
                      <button type="submit" className="rounded-full border border-linea px-3 py-1.5 text-xs transition hover:bg-white/10">
                        Hacer dueño
                      </button>
                    </form>
                    <form action={eliminarUsuario.bind(null, u.id)}>
                      <button type="submit" className="rounded-full px-3 py-1.5 text-xs text-peligro transition hover:bg-peligro/15">
                        Eliminar
                      </button>
                    </form>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
