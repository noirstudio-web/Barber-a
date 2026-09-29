"use client";

import { CheckIcon, CopyIcon, WhatsappLogoIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { planes, type Plan } from "@/config/planes";

export function mensajeCodigo(codigo: string, plan: Plan, dias: number) {
  const enlace = `${window.location.origin}/admin/registro?codigo=${encodeURIComponent(codigo)}`;
  return [
    `¡Hola! Gracias por elegir Noir Studio.`,
    `Tu código de activación es: ${codigo}`,
    `Plan ${planes[plan].nombre}, ${dias} días.`,
    ``,
    `Actívalo aquí y crea tu usuario: ${enlace}`,
    `Si ya tienes tu barbería, ponlo en el panel, en Suscripción.`,
  ].join("\n");
}

// Copiar el código o abrir WhatsApp con el mensaje listo (se elige el contacto en WhatsApp)
export function EnviarCodigo({ codigo, plan, dias, grande = false }: { codigo: string; plan: Plan; dias: number; grande?: boolean }) {
  const [copiado, setCopiado] = useState(false);
  const clase = grande
    ? "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition active:scale-[0.98]"
    : "grid size-8 place-items-center rounded-full text-tenue transition hover:bg-white/10 hover:text-texto";

  return (
    <>
      <button
        type="button"
        aria-label="Copiar código"
        onClick={async () => {
          await navigator.clipboard.writeText(codigo);
          setCopiado(true);
          setTimeout(() => setCopiado(false), 1500);
        }}
        className={`${clase} ${grande ? "border border-linea hover:bg-white/10" : ""}`}
      >
        {copiado ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
        {grande && (copiado ? "Copiado" : "Copiar")}
      </button>
      <button
        type="button"
        aria-label="Enviar por WhatsApp"
        onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(mensajeCodigo(codigo, plan, dias))}`, "_blank", "noopener")}
        className={`${clase} ${grande ? "bg-[#25D366] text-[#0b1f12] hover:brightness-110" : ""}`}
      >
        <WhatsappLogoIcon size={16} weight={grande ? "fill" : "regular"} />
        {grande && "Enviar por WhatsApp"}
      </button>
    </>
  );
}
