import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (clave: string, sal: Buffer, largo: number) => Promise<Buffer>;

// Contraseñas guardadas como "scrypt$sal$hash" (base64)
export async function hashClave(clave: string): Promise<string> {
  const sal = randomBytes(16);
  const hash = await scryptAsync(clave, sal, 64);
  return `scrypt$${sal.toString("base64")}$${hash.toString("base64")}`;
}

export async function verificarClave(clave: string, guardada: string): Promise<boolean> {
  const [algoritmo, sal, hash] = guardada.split("$");
  if (algoritmo !== "scrypt" || !sal || !hash) return false;
  const esperado = Buffer.from(hash, "base64");
  const calculado = await scryptAsync(clave, Buffer.from(sal, "base64"), esperado.length);
  return timingSafeEqual(calculado, esperado);
}
