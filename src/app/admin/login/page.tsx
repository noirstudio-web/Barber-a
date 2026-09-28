import type { Metadata } from "next";
import { Marca } from "@/components/sitio/Marca";
import { claveAdmin } from "@/lib/token";
import { FormularioAcceso } from "./FormularioAcceso";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Acceso del equipo", robots: { index: false } };

export default function PaginaLogin() {
  const configurada = claveAdmin() !== null;
  const esDemo = !process.env.ADMIN_PASSWORD && configurada;

  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm">
        <Marca />
        <h1 className="mt-8 text-2xl font-semibold">Panel del equipo</h1>
        {configurada ? (
          <FormularioAcceso />
        ) : (
          <p className="mt-4 text-sm text-tenue">El acceso no está configurado. Define ADMIN_PASSWORD en las variables de entorno.</p>
        )}
        {esDemo && <p className="mt-6 rounded-xl bg-superficie px-4 py-3 text-sm text-tenue">Modo demo: la clave es <strong className="text-texto">demo</strong></p>}
      </div>
    </div>
  );
}
