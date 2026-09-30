"use client";

import { useActionState } from "react";
import { claseCampo, Mensaje } from "@/components/admin/Campo";
import { eliminarBarberia } from "../../../acciones";

export function EliminarBarberia({ id, nombre }: { id: number; nombre: string }) {
  const [estado, accion, pendiente] = useActionState(eliminarBarberia.bind(null, id), {});
  return (
    <form action={accion} className="mt-4 space-y-3 rounded-2xl border border-peligro/40 p-5">
      <p className="text-sm">
        Se borran para siempre su web, citas, clientes, barberos, servicios, fotos y las cuentas de su equipo. Los pagos quedan en tu historial. Esto no se puede deshacer.
      </p>
      <label htmlFor="confirmar" className="block text-sm font-medium">
        Para confirmar, escribe <strong>{nombre}</strong>
      </label>
      <div className="flex flex-wrap gap-3">
        <input id="confirmar" name="confirmar" required autoComplete="off" className={`${claseCampo} max-w-sm`} />
        <button type="submit" disabled={pendiente} className="rounded-full bg-peligro px-5 py-2.5 text-sm font-semibold text-fondo transition active:scale-[0.98] disabled:opacity-50">
          {pendiente ? "Eliminando..." : "Eliminar barbería"}
        </button>
      </div>
      <Mensaje estado={estado} />
    </form>
  );
}
