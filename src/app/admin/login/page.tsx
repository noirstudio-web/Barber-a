import { count } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Marca } from "@/components/sitio/Marca";
import { getDb } from "@/db";
import { usuarios } from "@/db/schema";
import { codigoRegistro } from "@/lib/token";
import { FormularioAcceso } from "./FormularioAcceso";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Acceso del equipo", robots: { index: false } };

export default async function PaginaLogin() {
  const db = await getDb();
  const [{ total }] = await db.select({ total: count() }).from(usuarios);
  // Sin usuarios todavía: lo primero es crear la cuenta del dueño
  if (total === 0) redirect("/admin/registro");

  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm">
        <Marca />
        <h1 className="mt-8 text-2xl font-semibold">Panel del equipo</h1>
        {codigoRegistro() ? (
          <>
            <FormularioAcceso />
            <p className="mt-6 text-sm text-tenue">
              ¿Primera vez?{" "}
              <Link href="/admin/registro" className="text-texto underline underline-offset-4">
                Crea tu usuario
              </Link>
            </p>
          </>
        ) : (
          <p className="mt-4 text-sm text-tenue">El acceso no está configurado. Define ADMIN_PASSWORD en las variables de entorno.</p>
        )}
      </div>
    </div>
  );
}
