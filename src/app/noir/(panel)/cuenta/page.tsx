import { exigirNoir } from "@/lib/sesion";
import { FormularioClave } from "../../../admin/(panel)/cuenta/FormularioClave";

export const dynamic = "force-dynamic";

export default async function CuentaNoir() {
  const yo = await exigirNoir();
  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-semibold">Mi cuenta</h1>
      <p className="mt-1 text-sm text-tenue">
        {yo.nombre}, usuario <span className="text-texto">{yo.usuario}</span>
      </p>
      <p className="mt-4 text-sm text-tenue">
        Otra persona de tu equipo puede crear su cuenta en <span className="text-texto">/noir/registro</span> con el código maestro.
      </p>
      <h2 className="mt-8 text-lg font-semibold">Cambiar contraseña</h2>
      <FormularioClave />
    </div>
  );
}
