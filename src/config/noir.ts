// Datos de Noir Studio, dueña de la plataforma.

export const noir = {
  nombre: "Noir Studio",
  // WhatsApp de ventas (formato internacional, sin "+"), desde NEXT_PUBLIC_NOIR_WHATSAPP.
  // Vacío: los botones abren WhatsApp para elegir el contacto.
  whatsapp: process.env.NEXT_PUBLIC_NOIR_WHATSAPP ?? "",
  // Barbería de demostración que se muestra en la página de venta
  demo: "filo",
};

// Direcciones que no pueden usarse como nombre de una barbería
export const SLUGS_RESERVADOS = new Set([
  "admin", "noir", "api", "reservar", "reserva", "img", "noir-studio", "uploads", "_next",
  "favicon.ico", "robots.txt", "sitemap.xml", "registro", "login", "planes", "precios",
]);
