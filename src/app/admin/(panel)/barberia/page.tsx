import { limitesPlan } from "@/lib/barberias";
import { exigirDueno } from "@/lib/sesion";
import { FormularioBarberia } from "./FormularioBarberia";

export const dynamic = "force-dynamic";

export default async function PaginaMiBarberia({ searchParams }: PageProps<"/admin/barberia">) {
  const { barberia } = await exigirDueno();
  const { bienvenida } = await searchParams;

  return (
    <div className="max-w-3xl">
      {bienvenida && (
        <div className="mb-8 rounded-2xl border border-cromo/30 bg-superficie p-5">
          <p className="font-semibold">¡Tu barbería ya está activa!</p>
          <p className="mt-1 text-sm text-tenue">
            Completa estos datos, sube tu logo y una foto de portada. Luego revisa tus servicios, precios y barberos en las otras pestañas.
          </p>
        </div>
      )}
      <h1 className="text-2xl font-semibold">Mi barbería</h1>
      <p className="mt-1 text-sm text-tenue">Todo lo que ves en tu web. Los cambios se publican al guardar.</p>
      <FormularioBarberia barberia={barberia} premium={limitesPlan(barberia).herramientasPremium} />
    </div>
  );
}
