import type { Metadata } from "next";
import Link from "next/link";
import { Marca, marcaNoir } from "@/components/sitio/Marca";
import { codigoMaestro } from "@/lib/token";
import { FormularioNoir } from "./FormularioNoir";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Cuenta de Noir Studio", robots: { index: false } };

export default function RegistroNoir() {
  const esDemo = !process.env.ADMIN_PASSWORD && codigoMaestro() !== null;
  return (
    <div className="grid min-h-dvh place-items-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Marca {...marcaNoir} />
        <h1 className="mt-8 text-2xl font-semibold">Cuenta de administración</h1>
        <p className="mt-2 text-sm text-tenue">Para el equipo de Noir Studio. Necesitas el código maestro.</p>
        <FormularioNoir />
        {esDemo && <p className="mt-6 rounded-xl bg-superficie px-4 py-3 text-sm text-tenue">Modo local: el código maestro es <strong className="text-texto">demo</strong></p>}
        <p className="mt-6 text-sm text-tenue">
          ¿Ya tienes cuenta?{" "}
          <Link href="/admin/login" className="text-texto underline underline-offset-4">
            Entra aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
