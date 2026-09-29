import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";

const TIPOS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
// Vercel acepta hasta 4.5 MB por petición; el panel reduce las fotos antes de subirlas
const MAX_BYTES = 4 * 1024 * 1024;

export function archivoDeImagen(valor: FormDataEntryValue | null): File | null {
  return valor instanceof File && valor.size > 0 ? valor : null;
}

// Guarda una foto subida desde el panel y devuelve su URL pública.
// En Vercel va a Vercel Blob (BLOB_READ_WRITE_TOKEN); en local, a public/uploads.
export async function guardarImagen(archivo: File, carpeta: string): Promise<{ url: string } | { error: string }> {
  const ext = TIPOS[archivo.type];
  if (!ext) return { error: "La foto debe ser JPG, PNG o WEBP." };
  if (archivo.size > MAX_BYTES) return { error: "La foto pesa más de 4 MB." };
  const nombre = `${carpeta}/${randomUUID()}.${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`barberias/${nombre}`, archivo, { access: "public", contentType: archivo.type });
    return { url: blob.url };
  }
  if (process.env.VERCEL) return { error: "El almacenamiento de fotos no está configurado." };

  const destino = path.join(process.cwd(), "public", "uploads", nombre);
  await mkdir(path.dirname(destino), { recursive: true });
  await writeFile(destino, Buffer.from(await archivo.arrayBuffer()));
  return { url: `/uploads/${nombre}` };
}
