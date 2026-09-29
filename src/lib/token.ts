// Sesión del panel: una cookie firmada con HMAC que guarda el id del usuario y su vencimiento.
// Este archivo no usa APIs de Node ni de Next para poder usarse también en el proxy.

export const COOKIE_SESION = "noir_panel";
export const DURACION_S = 60 * 60 * 24 * 14;

// Código maestro de Noir Studio: se pide para crear cuentas del panel /noir.
// En producción es ADMIN_PASSWORD; en desarrollo, si no está definido, es "demo".
export function codigoMaestro(): string | null {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  return process.env.NODE_ENV === "production" ? null : "demo";
}

function secreto(): string | null {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  const codigo = codigoMaestro();
  return codigo ? `sesion:${codigo}` : null;
}

async function firmar(valor: string, clave: string): Promise<string> {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(clave), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const firma = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(valor));
  return btoa(String.fromCharCode(...new Uint8Array(firma))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function igualesSeguro(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function codigoMaestroCorrecto(intento: string): Promise<boolean> {
  const codigo = codigoMaestro();
  const s = secreto();
  if (!codigo || !s) return false;
  // Compara firmas de igual longitud para no filtrar información por tiempos
  return igualesSeguro(await firmar(intento, s), await firmar(codigo, s));
}

export async function crearToken(usuarioId: number): Promise<string> {
  const s = secreto();
  if (!s) throw new Error("Falta SESSION_SECRET o ADMIN_PASSWORD");
  const carga = `${usuarioId}.${Math.floor(Date.now() / 1000) + DURACION_S}`;
  return `${carga}.${await firmar(carga, s)}`;
}

// Devuelve el id del usuario si el token es válido y no ha vencido
export async function leerToken(token: string | undefined): Promise<number | null> {
  const s = secreto();
  if (!token || !s) return null;
  const [id, vence, firma] = token.split(".");
  if (!id || !vence || !firma || Number(vence) < Date.now() / 1000) return null;
  if (!igualesSeguro(firma, await firmar(`${id}.${vence}`, s))) return null;
  const usuarioId = Number(id);
  return Number.isInteger(usuarioId) ? usuarioId : null;
}
