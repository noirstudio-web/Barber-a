"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

// Aparición suave al entrar en pantalla, para marcar el orden de lectura de cada sección.
export function Revelar({ children, retraso = 0, className }: { children: ReactNode; retraso?: number; className?: string }) {
  const reducir = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reducir ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, delay: retraso, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
