"use client";

import { useActionState, useState } from "react";
import { Campo, Entrada, Mensaje } from "@/components/admin/Campo";
import { Boton } from "@/components/sitio/Boton";
import { activarBarberia } from "../acciones";

function slugDesde(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function FormularioActivacion({ codigoInicial }: { codigoInicial: string }) {
  const [estado, accion, pendiente] = useActionState(activarBarberia, {});
  const v = estado.valores;
  const [nombre, setNombre] = useState(v?.barberia ?? "");
  const [slug, setSlug] = useState(v?.slug ?? "");
  const [slugTocado, setSlugTocado] = useState(false);
  const direccion = slugTocado ? slug : slugDesde(nombre);

  return (
    <form action={accion} className="mt-8 space-y-8">
      <fieldset className="space-y-4">
        <legend className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-tenue">Tu código</legend>
        <Campo etiqueta="Código de activación" id="codigo" ayuda="Ej: NOIR-7K2M-Q9XP">
          <Entrada key={`c${v?.codigo}`} id="codigo" name="codigo" required defaultValue={v?.codigo ?? codigoInicial} autoComplete="off" autoCapitalize="characters" className="font-mono tracking-widest" />
        </Campo>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-tenue">Tu barbería</legend>
        <Campo etiqueta="Nombre de la barbería" id="barberia">
          <Entrada id="barberia" name="barberia" required minLength={2} maxLength={60} value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </Campo>
        <Campo etiqueta="Dirección de tu web" id="slug" ayuda={`Tu web quedará en esta página/${direccion || "tu-barberia"}`}>
          <Entrada
            id="slug"
            name="slug"
            required
            value={direccion}
            onChange={(e) => {
              setSlugTocado(true);
              setSlug(slugDesde(e.target.value));
            }}
            autoCapitalize="none"
          />
        </Campo>
        <Campo etiqueta="WhatsApp de la barbería" id="whatsapp" ayuda="Aquí te llegan los avisos de nuevas citas. Con indicativo, ej: 573001234567">
          <Entrada key={`w${v?.whatsapp}`} id="whatsapp" name="whatsapp" inputMode="tel" defaultValue={v?.whatsapp} />
        </Campo>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-tenue">Tu cuenta</legend>
        <Campo etiqueta="Tu nombre" id="nombre">
          <Entrada key={`n${v?.nombre}`} id="nombre" name="nombre" required minLength={2} maxLength={60} autoComplete="name" defaultValue={v?.nombre} />
        </Campo>
        <Campo etiqueta="Usuario" id="usuario" ayuda="Sin espacios. Ej: carlos.barber">
          <Entrada key={`u${v?.usuario}`} id="usuario" name="usuario" required minLength={3} maxLength={30} autoComplete="username" autoCapitalize="none" defaultValue={v?.usuario} />
        </Campo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Contraseña" id="clave" ayuda="Mínimo 8 caracteres">
            <Entrada id="clave" name="clave" type="password" required minLength={8} autoComplete="new-password" />
          </Campo>
          <Campo etiqueta="Repite la contraseña" id="clave2">
            <Entrada id="clave2" name="clave2" type="password" required minLength={8} autoComplete="new-password" />
          </Campo>
        </div>
      </fieldset>

      <Mensaje estado={estado} />
      <Boton type="submit" disabled={pendiente} className="w-full py-3.5">
        {pendiente ? "Activando..." : "Activar mi barbería"}
      </Boton>
    </form>
  );
}
