import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { usuarios, type Usuario } from "@/db/schema";
import { COOKIE_SESION, crearToken, DURACION_S, leerToken } from "./token";

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

export async function guardarSesion(usuarioId: number) {
  (await cookies()).set(COOKIE_SESION, await crearToken(usuarioId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACION_S,
  });
}

export async function borrarSesion() {
  (await cookies()).delete(COOKIE_SESION);
}

export async function usuarioActual(): Promise<Usuario | null> {
  const id = await leerToken((await cookies()).get(COOKIE_SESION)?.value);
  if (id === null) return null;
  const db = await getDb();
  const [usuario] = await db.select().from(usuarios).where(eq(usuarios.id, id));
  return usuario ?? null;
}

// Para páginas y acciones del panel: sin sesión válida, al login
export async function exigirAdmin(): Promise<Usuario> {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/admin/login");
  return usuario;
}

export async function exigirDueno(): Promise<Usuario> {
  const usuario = await exigirAdmin();
  if (usuario.rol !== "dueno") redirect("/admin");
  return usuario;
}
