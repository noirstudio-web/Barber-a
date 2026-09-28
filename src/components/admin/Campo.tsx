import type { ComponentProps, ReactNode } from "react";

export const claseCampo =
  "w-full rounded-xl border border-linea bg-superficie px-4 py-2.5 text-sm outline-none transition focus:border-cromo [color-scheme:dark] disabled:opacity-40";

export function Campo({ etiqueta, id, children, ayuda }: { etiqueta: string; id: string; children: ReactNode; ayuda?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium">
        {etiqueta}
      </label>
      {children}
      {ayuda && <p className="text-xs text-tenue">{ayuda}</p>}
    </div>
  );
}

export function Entrada(props: ComponentProps<"input">) {
  return <input {...props} className={`${claseCampo} ${props.className ?? ""}`} />;
}

export function Mensaje({ estado }: { estado: { error?: string; ok?: string } }) {
  if (estado.error) return <p role="alert" className="text-sm text-peligro">{estado.error}</p>;
  if (estado.ok) return <p role="status" className="text-sm text-exito">{estado.ok}</p>;
  return null;
}
