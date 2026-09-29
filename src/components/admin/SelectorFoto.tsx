"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { comprimirImagen } from "@/lib/comprimir";

// Campo de archivo para una foto, con vista previa antes de guardar
export function SelectorFoto({
  nombre,
  etiqueta,
  vistaPrevia,
  className = "",
}: {
  nombre: string;
  etiqueta: string;
  vistaPrevia: ReactNode;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);

  return (
    <div className={`flex shrink-0 flex-col items-start gap-2 ${className}`}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="Vista previa" className="size-24 rounded-xl object-cover" />
      ) : (
        vistaPrevia
      )}
      <label className="cursor-pointer rounded-full border border-linea px-3 py-1.5 text-xs transition hover:bg-white/10">
        {url ? "Otra foto" : etiqueta}
        <input
          ref={input}
          type="file"
          name={nombre}
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={async (e) => {
            const original = e.target.files?.[0];
            if (!original) return setUrl(null);
            // Reemplaza el archivo del campo por la versión reducida
            const reducido = await comprimirImagen(original);
            const lista = new DataTransfer();
            lista.items.add(reducido);
            if (input.current) input.current.files = lista.files;
            setUrl(URL.createObjectURL(reducido));
          }}
        />
      </label>
    </div>
  );
}
