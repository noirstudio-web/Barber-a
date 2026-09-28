"use client";

import { ListIcon, XIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { BotonEnlace } from "./Boton";
import { Marca } from "./Marca";

const enlaces = [
  { href: "/#servicios", texto: "Servicios" },
  { href: "/#barberos", texto: "Barberos" },
  { href: "/#galeria", texto: "Galería" },
  { href: "/#ubicacion", texto: "Ubicación" },
];

export function Navegacion() {
  const [abierto, setAbierto] = useState(false);
  const reducir = useReducedMotion();

  return (
    <header className="sticky top-0 z-40 border-b border-linea bg-fondo/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <Marca />
        <ul className="hidden items-center gap-8 md:flex">
          {enlaces.map((e) => (
            <li key={e.href}>
              <a href={e.href} className="text-sm text-tenue transition hover:text-texto">
                {e.texto}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <BotonEnlace href="/reservar" className="hidden px-5 py-2.5 sm:inline-flex">
            Reservar cita
          </BotonEnlace>
          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            className="grid size-10 place-items-center rounded-full border border-linea md:hidden"
            aria-expanded={abierto}
            aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
          >
            {abierto ? <XIcon size={18} /> : <ListIcon size={18} />}
          </button>
        </div>
      </nav>
      <AnimatePresence>
        {abierto && (
          <motion.div
            initial={reducir ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducir ? undefined : { opacity: 0, y: -8 }}
            className="border-t border-linea px-4 pb-6 pt-2 md:hidden"
          >
            <ul className="flex flex-col">
              {enlaces.map((e) => (
                <li key={e.href}>
                  <a href={e.href} onClick={() => setAbierto(false)} className="block py-3 text-lg">
                    {e.texto}
                  </a>
                </li>
              ))}
            </ul>
            <BotonEnlace href="/reservar" className="mt-4 w-full">
              Reservar cita
            </BotonEnlace>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
