import { count } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { Marca } from "@/components/sitio/Marca";
import { getDb } from "@/db";
import { usuarios } from "@/db/schema";
import { codigoRegistro } from "@/lib/token";
import { FormularioRegistro } from "./FormularioRegistro";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Crear usuario", robots: { index: false } };

export default async function PaginaRegistro() {
  const db = await getDb();
  const [{ total }] = await db.select({ total: count() }).from(usuarios);
  const primero = total === 0;
  const esDemo = !process.env.ADMIN_PASSWORD && codigoRegistro() !== null;

  return (
    <div className="grid min-h-dvh place-items-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Marca />
        <h1 className="mt-8 text-2xl font-semibold">{primero ? "Crea la cuenta del dueño" : "Crea tu usuario"}</h1>
        <p className="mt-2 text-sm text-tenue">
          {primero
            ? "Es la primera cuenta del panel. Podrás ver y administrar los usuarios del equipo."
            : "Pide el código del negocio al dueño de la barbería."}
        </p>
        {codigoRegistro() ? (
          <FormularioRegistro />
        ) : (
          <p className="mt-4 text-sm text-tenue">El registro no está configurado. Define ADMIN_PASSWORD en las variables de entorno.</p>
        )}
        {esDemo && <p className="mt-6 rounded-xl bg-superficie px-4 py-3 text-sm text-tenue">Modo local: el código del negocio es <strong className="text-texto">demo</strong></p>}
        {!primero && (
          <p className="mt-6 text-sm text-tenue">
            ¿Ya tienes usuario?{" "}
            <Link href="/admin/login" className="text-texto underline underline-offset-4">
              Entra aquí
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
