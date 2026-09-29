"use client";

import { useActionState, useState } from "react";
import { Campo, claseCampo, Entrada, Mensaje } from "@/components/admin/Campo";
import { Boton } from "@/components/sitio/Boton";
import { METODOS_PAGO, PLANES, planes, type Plan } from "@/config/planes";
import { registrarPago } from "../../acciones";

type Opcion = { id: number; nombre: string; plan: Plan };

// Pago de una barbería existente, con opción de renovar en el mismo paso
export function FormularioPago({ barberias }: { barberias: Opcion[] }) {
  const [estado, accion, pendiente] = useActionState(registrarPago, {});
  const [barberiaId, setBarberiaId] = useState(barberias.length === 1 ? barberias[0].id : 0);
  const actual = barberias.find((b) => b.id === barberiaId);
  const [plan, setPlan] = useState<Plan>(actual && actual.plan !== "prueba" ? actual.plan : "premium");
  const [renovar, setRenovar] = useState(true);

  return (
    <form action={accion} className="mt-4 space-y-4 rounded-2xl border border-linea p-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {barberias.length === 1 ? (
          <input type="hidden" name="barberiaId" value={barberias[0].id} />
        ) : (
          <Campo etiqueta="Barbería" id="barberiaId">
            <select
              id="barberiaId"
              name="barberiaId"
              required
              value={barberiaId}
              onChange={(e) => {
                const id = Number(e.target.value);
                setBarberiaId(id);
                const b = barberias.find((x) => x.id === id);
                if (b && b.plan !== "prueba") setPlan(b.plan);
              }}
              className={claseCampo}
            >
              <option value={0} disabled>
                Elige una barbería
              </option>
              {barberias.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nombre}
                </option>
              ))}
            </select>
          </Campo>
        )}
        <Campo etiqueta="Plan" id="pago-plan">
          <select id="pago-plan" name="plan" value={plan} onChange={(e) => setPlan(e.target.value as Plan)} className={claseCampo}>
            {PLANES.filter((p) => p !== "prueba").map((p) => (
              <option key={p} value={p}>
                {planes[p].nombre}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Monto (USD)" id="monto">
          <Entrada key={plan} id="monto" name="monto" inputMode="decimal" required defaultValue={planes[plan].precioUsd} />
        </Campo>
        <Campo etiqueta="Medio de pago" id="metodo">
          <select id="metodo" name="metodo" className={claseCampo} defaultValue="Nequi">
            {METODOS_PAGO.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </Campo>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Quién pagó (opcional)" id="cliente" ayuda="Si lo dejas vacío se usa el nombre de la barbería">
          <Entrada id="cliente" name="cliente" maxLength={80} />
        </Campo>
        <Campo etiqueta="Referencia (opcional)" id="referencia" ayuda="Número de comprobante o nota">
          <Entrada id="referencia" name="referencia" maxLength={80} />
        </Campo>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="renovar" checked={renovar} onChange={(e) => setRenovar(e.target.checked)} className="size-4 accent-[var(--cromo)]" />
          Renovar la suscripción
        </label>
        {renovar && (
          <label className="flex items-center gap-2 text-tenue">
            por
            <input key={plan} name="dias" type="number" min={1} max={400} defaultValue={planes[plan].dias} aria-label="Días" className={`${claseCampo} w-20 py-1.5`} />
            días
          </label>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Boton type="submit" disabled={pendiente}>
          {pendiente ? "Guardando..." : "Registrar pago"}
        </Boton>
        <Mensaje estado={estado} />
      </div>
    </form>
  );
}
