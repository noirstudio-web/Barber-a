// Sesión del panel: una cookie firmada con HMAC. Sin usuarios ni tablas: una sola clave
// de acceso (ADMIN_PASSWORD) para el dueño y su equipo.

export const COOKIE_SESION = "filo_admin";
export const DURACION_S = 60 * 60 * 24 * 14;

export function claveAdmin(): string | null {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  // En desarrollo hay una clave por defecto para poder probar la demo
  return process.env.NODE_ENV === "production" ? null : "demo";
}

function secreto(): string | null {
  const clave = claveAdmin();
  if (!clave) return null;
  return process.env.SESSION_SECRET ?? `sesion:${clave}`;
}

async function firmar(valor: string, clave: string): Promise<string> {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(clave), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const firma = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(valor));
  return btoa(String.fromCharCode(...new Uint8Array(firma))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function igualesSeguro(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function claveCorrecta(intento: string): Promise<boolean> {
  const clave = claveAdmin();
  const s = secreto();
  if (!clave || !s) return false;
  // Compara firmas de igual longitud para no filtrar información por tiempos
  return igualesSeguro(await firmar(intento, s), await firmar(clave, s));
}

export async function crearToken(): Promise<string> {
  const s = secreto();
  if (!s) throw new Error("Falta ADMIN_PASSWORD");
  const vence = String(Math.floor(Date.now() / 1000) + DURACION_S);
  return `${vence}.${await firmar(vence, s)}`;
}

export async function tokenValido(token: string | undefined): Promise<boolean> {
  const s = secreto();
  if (!token || !s) return false;
  const [vence, firma] = token.split(".");
  if (!vence || !firma || Number(vence) < Date.now() / 1000) return false;
  return igualesSeguro(firma, await firmar(vence, s));
}
