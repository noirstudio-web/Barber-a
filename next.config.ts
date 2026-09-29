import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite (base de datos local de desarrollo) trae su propio WASM y no debe empaquetarse
  serverExternalPackages: ["@electric-sql/pglite"],
  experimental: {
    // Fotos subidas desde el panel (ya reducidas en el navegador)
    serverActions: { bodySizeLimit: "4mb" },
  },
  images: {
    // Fotos que suben las barberías a Vercel Blob
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
};

export default nextConfig;
