// En el navegador: reduce una foto a máximo `lado` píxeles y la pasa a WEBP.
// Las fotos de celular pesan varios MB; así suben rápido y la web carga más ligera.
export async function comprimirImagen(archivo: File, lado = 1600, calidad = 0.82): Promise<File> {
  if (!archivo.type.startsWith("image/")) return archivo;
  try {
    const bitmap = await createImageBitmap(archivo);
    const escala = Math.min(1, lado / Math.max(bitmap.width, bitmap.height));
    const lienzo = document.createElement("canvas");
    lienzo.width = Math.round(bitmap.width * escala);
    lienzo.height = Math.round(bitmap.height * escala);
    lienzo.getContext("2d")?.drawImage(bitmap, 0, 0, lienzo.width, lienzo.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((ok) => lienzo.toBlob(ok, "image/webp", calidad));
    if (!blob || blob.size >= archivo.size) return archivo;
    return new File([blob], archivo.name.replace(/\.\w+$/, "") + ".webp", { type: "image/webp" });
  } catch {
    return archivo;
  }
}
