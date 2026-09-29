import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { usuarios, type Barberia, type Usuario } from "@/db/schema";
import { barberiaPorId, estadoSuscripcion } from "./barberias";
import { COOKIE_SESION, crearToken, DURACION_S, leerToken } from "./token";

export { hashClave, verificarClave } from "./claves";

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

export async function exigirUsuario(): Promise<Usuario> {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/admin/login");
  return usuario;
}

export type SesionPanel = { usuario: Usuario; barberia: Barberia };

// Para páginas y acciones del panel de una barbería. Con la suscripción vencida solo se
// permite entrar a las páginas que lo indiquen (suscripción y cuenta).
export async function exigirPanel({ permitirVencida = false } = {}): Promise<SesionPanel> {
  const usuario = await exigirUsuario();
  if (usuario.rol === "noir") redirect("/noir");
  const barberia = usuario.barberiaId ? await barberiaPorId(usuario.barberiaId) : null;
  if (!barberia) redirect("/admin/login");
  if (!permitirVencida && !estadoSuscripcion(barberia).activa) redirect("/admin/suscripcion");
  return { usuario, barberia };
}

export async function exigirDueno(opciones?: { permitirVencida?: boolean }): Promise<SesionPanel> {
  const sesion = await exigirPanel(opciones);
  if (sesion.usuario.rol !== "dueno") redirect("/admin");
  return sesion;
}

// Panel de Noir Studio
export async function exigirNoir(): Promise<Usuario> {
  const usuario = await exigirUsuario();
  if (usuario.rol !== "noir") redirect("/admin");
  return usuario;
}
