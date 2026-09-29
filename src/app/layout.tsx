import type { Metadata, Viewport } from "next";
import { Archivo, Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], axes: ["wdth"] });

export const metadata: Metadata = {
  title: { default: "Noir Studio | Web con reservas para barberías", template: "%s | Noir Studio" },
  description: "Tu barbería con web propia: tus clientes reservan solos, eligen barbero y hora, y a ti te llega la cita por WhatsApp.",
  icons: {
    icon: [
      { url: "/noir-studio/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/noir-studio/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/noir-studio/apple-touch-icon.png",
  },
  openGraph: { images: ["/noir-studio/og-image.png"] },
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
