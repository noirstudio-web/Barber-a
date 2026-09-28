import type { Metadata, Viewport } from "next";
import { Archivo, Geist } from "next/font/google";
import { negocio } from "@/config/negocio";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], axes: ["wdth"] });

export const metadata: Metadata = {
  title: { default: `${negocio.nombre} | Barbería en Bogotá`, template: `%s | ${negocio.nombre}` },
  description: negocio.descripcion,
};

export const viewport: Viewport = {
  themeColor: "#0b0b0d",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${geist.variable} ${archivo.variable} antialiased`}>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
