"use client";

import { useActionState, useState } from "react";
import { Campo, claseCampo, Entrada, Mensaje } from "@/components/admin/Campo";
import { Boton } from "@/components/sitio/Boton";
import { METODOS_PAGO, PLANES, planes, type Plan } from "@/config/planes";
import { generarCodigo, type EstadoCodigo } from "../../acciones";
import { EnviarCodigo } from "./EnviarCodigo";

export function GenerarCodigo() {
  const [estado, accion, pendiente] = useActionState<EstadoCodigo, FormData>(generarCodigo, {});
  const [plan, setPlan] = useState<Plan>("premium");
  const [pagado, setPagado] = useState(true);
  const esPrueba = plan === "prueba";

  return (
    <div className="mt-6 space-y-6">
      <form action={accion} className="space-y-4 rounded-2xl border border-linea p-5">
        <div className="grid grid-cols-2 gap-4">
          <Campo etiqueta="Plan" id="plan">
            <select
              id="plan"
              name="plan"
              value={plan}
              onChange={(e) => {
                const p = e.target.value as Plan;
                setPlan(p);
                setPagado(p !== "prueba");
              }}
              className={claseCampo}
            >
              {PLANES.map((p) => (
                <option key={p} value={p}>
                  {planes[p].nombre} {planes[p].precioUsd ? `(${planes[p].precioUsd} USD)` : ""}
                </option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Días" id="dias">
            <Entrada key={plan} id="dias" name="dias" type="number" min={1} max={400} defaultValue={planes[plan].dias} required />
          </Campo>
        </div>
        <Campo etiqueta="Cliente" id="cliente" ayuda="Nombre de quien compra o de su barbería">
          <Entrada id="cliente" name="cliente" maxLength={80} placeholder="Carlos, Barbería El Parce" />
        </Campo>

        {!esPrueba && (
          <div className="space-y-4 rounded-xl bg-superficie p-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" name="pagado" checked={pagado} onChange={(e) => setPagado(e.target.checked)} className="size-4 accent-[var(--cromo)]" />
              Ya pagó: registrar el pago
            </label>
            {pagado && (
              <div className="grid gap-4 sm:grid-cols-3">
                <Campo etiqueta="Monto (USD)" id="monto">
                  <Entrada key={plan} id="monto" name="monto" inputMode="decimal" required defaultValue={planes[plan].precioUsd} />
                </Campo>
                <Campo etiqueta="Medio" id="metodo">
                  <select id="metodo" name="metodo" className={claseCampo} defaultValue="Nequi">
                    {METODOS_PAGO.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </Campo>
                <Campo etiqueta="Referencia" id="referencia">
                  <Entrada id="referencia" name="referencia" maxLength={80} placeholder="Opcional" />
                </Campo>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-4">
          <Boton type="submit" disabled={pendiente}>
            {pendiente ? "Generando..." : "Generar código"}
          </Boton>
          {estado.error && <Mensaje estado={estado} />}
        </div>
      </form>

      {estado.codigo && estado.plan && estado.dias && (
        <div className="rounded-2xl bg-superficie p-6">
          <p className="text-sm text-tenue">
            {estado.ok} {planes[estado.plan].nombre}, {estado.dias} días{estado.nota && ` para ${estado.nota}`}
          </p>
          <p className="display mt-2 break-all font-mono text-3xl font-semibold tracking-widest">{estado.codigo}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <EnviarCodigo codigo={estado.codigo} plan={estado.plan} dias={estado.dias} grande />
          </div>
        </div>
      )}
    </div>
  );
}
