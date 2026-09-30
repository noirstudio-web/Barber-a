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
  const c = await cookies();
  c.delete(COOKIE_SESION);
  c.delete(COOKIE_VER_BARBERIA);
}

// Noir Studio puede entrar al panel de una barbería para ayudar al dueño. La cookie solo guarda
// qué barbería ver: el permiso lo da que el usuario de la sesión sea de Noir.
export const COOKIE_VER_BARBERIA = "noir_ver_barberia";

export async function verComoNoir(barberiaId: number | null) {
  const c = await cookies();
  if (barberiaId === null) c.delete(COOKIE_VER_BARBERIA);
  else c.set(COOKIE_VER_BARBERIA, String(barberiaId), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 8 });
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

// comoNoir: es Noir Studio viendo el panel de la barbería, no alguien de la barbería
export type SesionPanel = { usuario: Usuario; barberia: Barberia; comoNoir: boolean };

// Para páginas y acciones del panel de una barbería. Con la suscripción vencida solo se
// permite entrar a las páginas que lo indiquen (suscripción y cuenta).
export async function exigirPanel({ permitirVencida = false } = {}): Promise<SesionPanel> {
  const usuario = await exigirUsuario();
  const comoNoir = usuario.rol === "noir";
  const id = comoNoir ? Number((await cookies()).get(COOKIE_VER_BARBERIA)?.value) || null : usuario.barberiaId;
  if (comoNoir && !id) redirect("/noir");
  const barberia = id ? await barberiaPorId(id) : null;
  if (!barberia) redirect(comoNoir ? "/noir" : "/admin/login");
  if (!permitirVencida && !estadoSuscripcion(barberia).activa) redirect("/admin/suscripcion");
  return { usuario, barberia, comoNoir };
}

export async function exigirDueno(opciones?: { permitirVencida?: boolean }): Promise<SesionPanel> {
  const sesion = await exigirPanel(opciones);
  if (sesion.usuario.rol !== "dueno" && !sesion.comoNoir) redirect("/admin");
  return sesion;
}

// Panel de Noir Studio
export async function exigirNoir(): Promise<Usuario> {
  const usuario = await exigirUsuario();
  if (usuario.rol !== "noir") redirect("/admin");
  return usuario;
}
