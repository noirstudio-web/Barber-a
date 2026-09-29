"use client";

import { UploadSimpleIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Mensaje } from "@/components/admin/Campo";
import { comprimirImagen } from "@/lib/comprimir";
import { subirFotoGaleria } from "../../acciones";

async function medidas(archivo: File) {
  try {
    const b = await createImageBitmap(archivo);
    const m = { ancho: b.width, alto: b.height };
    b.close();
    return m;
  } catch {
    return { ancho: 900, alto: 900 };
  }
}

// Sube varias fotos, reducidas en el navegador, de a una para no pasar el límite por petición
export function SubirFotos() {
  const router = useRouter();
  const [progreso, setProgreso] = useState<{ hechas: number; total: number } | null>(null);
  const [estado, setEstado] = useState<{ error?: string; ok?: string }>({});

  async function subir(archivos: FileList | null) {
    const lista = Array.from(archivos ?? []).slice(0, 20);
    if (lista.length === 0) return;
    setEstado({});
    setProgreso({ hechas: 0, total: lista.length });
    let subidas = 0;
    for (const original of lista) {
      const archivo = await comprimirImagen(original);
      const { ancho, alto } = await medidas(archivo);
      const datos = new FormData();
      datos.set("foto", archivo);
      datos.set("ancho", String(ancho));
      datos.set("alto", String(alto));
      const r = await subirFotoGaleria(datos);
      if (r.error) {
        setEstado({ error: r.error });
        break;
      }
      subidas++;
      setProgreso({ hechas: subidas, total: lista.length });
    }
    setProgreso(null);
    if (subidas > 0) setEstado((e) => (e.error ? e : { ok: subidas === 1 ? "Foto agregada." : `${subidas} fotos agregadas.` }));
    router.refresh();
  }

  return (
    <div className="mt-6 flex flex-wrap items-center gap-4">
      <label
        className={`inline-flex cursor-pointer items-center gap-2 rounded-full bg-cromo px-6 py-3 text-sm font-semibold text-fondo transition hover:bg-white ${progreso ? "pointer-events-none opacity-60" : ""}`}
      >
        <UploadSimpleIcon size={18} />
        {progreso ? `Subiendo ${progreso.hechas + 1} de ${progreso.total}...` : "Subir fotos"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          onChange={(e) => {
            subir(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
      <Mensaje estado={estado} />
    </div>
  );
}
