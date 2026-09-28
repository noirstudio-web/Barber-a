import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_SESION, crearToken, DURACION_S, tokenValido } from "./token";

export async function guardarSesion() {
  (await cookies()).set(COOKIE_SESION, await crearToken(), {
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

export async function exigirAdmin() {
  const token = (await cookies()).get(COOKIE_SESION)?.value;
  if (!(await tokenValido(token))) redirect("/admin/login");
}
