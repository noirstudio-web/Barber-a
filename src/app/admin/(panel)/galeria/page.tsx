import { TrashIcon } from "@phosphor-icons/react/ssr";
import Image from "next/image";
import { redirect } from "next/navigation";
import { limitesPlan } from "@/lib/barberias";
import { galeriaDe, resenasDe } from "@/lib/datos";
import { exigirPanel } from "@/lib/sesion";
import { eliminarFotoGaleria, eliminarResena } from "../../acciones";
import { FormularioResena } from "./FormularioResena";
import { SubirFotos } from "./SubirFotos";

export const dynamic = "force-dynamic";

export default async function PaginaGaleria() {
  const { barberia } = await exigirPanel();
  if (!limitesPlan(barberia).galeriaYResenas) redirect("/admin/suscripcion");
  const [fotos, resenas] = await Promise.all([galeriaDe(barberia.id), resenasDe(barberia.id)]);

  return (
    <div className="space-y-14">
      <section>
        <h1 className="text-2xl font-semibold">Galería</h1>
        <p className="mt-1 text-sm text-tenue">Fotos de tus trabajos. Aparecen en tu web estilo Instagram.</p>
        <SubirFotos />
        {fotos.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-linea px-6 py-10 text-center text-sm text-tenue">
            Aún no hay fotos. La sección Galería aparece en tu web cuando subes la primera.
          </p>
        ) : (
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {fotos.map((f) => (
              <li key={f.id} className="group relative aspect-square overflow-hidden rounded-xl bg-superficie">
                <Image src={f.url} alt={f.alt} fill sizes="200px" className="object-cover" />
                <form action={eliminarFotoGaleria.bind(null, f.id)} className="absolute right-1.5 top-1.5">
                  <button type="submit" aria-label="Eliminar foto" className="grid size-8 place-items-center rounded-full bg-fondo/80 text-texto transition hover:bg-peligro hover:text-fondo">
                    <TrashIcon size={16} />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h2 className="text-2xl font-semibold">Reseñas</h2>
          <p className="mt-1 text-sm text-tenue">Copia aquí lo que tus clientes dicen de ti, por ejemplo tus reseñas de Google.</p>
          <FormularioResena />
        </div>
        <div className="lg:col-span-7">
          {resenas.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-linea px-6 py-10 text-center text-sm text-tenue">Aún no hay reseñas.</p>
          ) : (
            <ul className="space-y-2">
              {resenas.map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-4 rounded-xl bg-superficie px-4 py-3 text-sm">
                  <div>
                    <p>“{r.texto}”</p>
                    <p className="mt-1 text-tenue">
                      {r.nombre}
                      {r.detalle && `, ${r.detalle}`}
                    </p>
                  </div>
                  <form action={eliminarResena.bind(null, r.id)}>
                    <button type="submit" aria-label="Eliminar reseña" className="grid size-8 shrink-0 place-items-center rounded-full text-tenue transition hover:bg-peligro/15 hover:text-peligro">
                      <TrashIcon size={16} />
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
