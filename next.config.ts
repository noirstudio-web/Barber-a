import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite (base de datos local de desarrollo) trae su propio WASM y no debe empaquetarse
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default nextConfig;
