import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESION, leerToken } from "@/lib/token";

// Control rápido del panel. Las páginas y acciones del panel vuelven a verificar la sesión.
export async function proxy(req: NextRequest) {
  const publicas = ["/admin/login", "/admin/registro", "/noir/registro"];
  if (publicas.includes(req.nextUrl.pathname)) return NextResponse.next();
  if ((await leerToken(req.cookies.get(COOKIE_SESION)?.value)) !== null) return NextResponse.next();
  return NextResponse.redirect(new URL("/admin/login", req.url));
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/noir", "/noir/:path*"],
};
