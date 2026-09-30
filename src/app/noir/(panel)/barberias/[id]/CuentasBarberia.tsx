"use client";

import { CopyIcon, KeyIcon, TrashIcon } from "@phosphor-icons/react";
import { useState, useTransition } from "react";
import { eliminarCuentaBarberia, restablecerClave, type EstadoClave } from "../../../acciones";

type Cuenta = { id: number; nombre: string; usuario: string; rol: string };

function FilaCuenta({ c }: { c: Cuenta }) {
  const [pendiente, iniciar] = useTransition();
  const [clave, setClave] = useState<EstadoClave | null>(null);
  const [confirmar, setConfirmar] = useState(false);

  return (
    <li className="rounded-xl bg-superficie px-4 py-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span>
          <span className="font-semibold">{c.nombre}</span> <span className="text-tenue">({c.usuario}, {c.rol === "dueno" ? "dueño" : "equipo"})</span>
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={pendiente}
            onClick={() => iniciar(async () => setClave(await restablecerClave(c.id)))}
            className="inline-flex items-center gap-1.5 rounded-full border border-linea px-3 py-1.5 text-xs transition hover:bg-white/10"
          >
            <KeyIcon size={14} /> Nueva contraseña
          </button>
          {confirmar ? (
            <>
              <span className="text-xs">¿Eliminar esta cuenta?</span>
              <button
                type="button"
                disabled={pendiente}
                onClick={() => iniciar(() => eliminarCuentaBarberia(c.id))}
                className="rounded-full bg-peligro px-3 py-1.5 text-xs font-semibold text-fondo"
              >
                Sí, eliminar
              </button>
              <button type="button" onClick={() => setConfirmar(false)} className="px-2 py-1.5 text-xs text-tenue hover:text-texto">
                No
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmar(true)}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-peligro transition hover:bg-peligro/15"
            >
              <TrashIcon size={14} /> Eliminar cuenta
            </button>
          )}
        </div>
      </div>
      {clave?.error && <p className="mt-2 text-xs text-peligro">{clave.error}</p>}
      {clave?.clave && (
        <p className="mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-fondo px-3 py-2 text-xs">
          Contraseña temporal para <strong>{clave.usuario}</strong>: <code className="font-mono text-sm tracking-wider">{clave.clave}</code>
          <button type="button" aria-label="Copiar contraseña" onClick={() => navigator.clipboard.writeText(clave.clave!)} className="text-tenue hover:text-texto">
            <CopyIcon size={14} />
          </button>
          <span className="text-tenue">Envíasela y dile que la cambie en Mi cuenta.</span>
        </p>
      )}
    </li>
  );
}

export function CuentasBarberia({ cuentas }: { cuentas: Cuenta[] }) {
  if (cuentas.length === 0) return <p className="mt-3 text-sm text-tenue">Esta barbería no tiene cuentas. Entra a su panel y crea una en Mi cuenta.</p>;
  return (
    <ul className="mt-3 space-y-2">
      {cuentas.map((c) => (
        <FilaCuenta key={c.id} c={c} />
      ))}
    </ul>
  );
}
