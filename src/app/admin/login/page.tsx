import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Marca, marcaNoir } from "@/components/sitio/Marca";
import { usuarioActual } from "@/lib/sesion";
import { FormularioAcceso } from "./FormularioAcceso";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Entrar al panel", robots: { index: false } };

export default async function PaginaLogin() {
  const yo = await usuarioActual();
  if (yo) redirect(yo.rol === "noir" ? "/noir" : "/admin");

  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm">
        <Marca {...marcaNoir} />
        <h1 className="mt-8 text-2xl font-semibold">Entra a tu panel</h1>
        <p className="mt-2 text-sm text-tenue">Para dueños y equipos de las barberías.</p>
        <FormularioAcceso />
        <p className="mt-8 rounded-xl bg-superficie px-4 py-3 text-sm text-tenue">
          ¿Compraste un plan y tienes un código?{" "}
          <Link href="/admin/registro" className="text-texto underline underline-offset-4">
            Activa tu barbería
          </Link>
        </p>
      </div>
    </div>
  );
}
