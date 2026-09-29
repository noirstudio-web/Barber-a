// Planes de suscripción de la plataforma. Cambia aquí precios, duración y límites.

export const PLANES = ["prueba", "basico", "premium"] as const;
export type Plan = (typeof PLANES)[number];

export type DetallePlan = {
  nombre: string;
  precioUsd: number;
  // Días que se agregan por defecto al activar un código de este plan
  dias: number;
  // null = sin límite
  maxBarberos: number | null;
  recordatoriosAutomaticos: boolean;
  galeriaYResenas: boolean;
  // Estadísticas, clientes por recuperar, exportar clientes, anuncio en la web y web sin la marca de Noir
  herramientasPremium: boolean;
  incluye: string[];
};

export const planes: Record<Plan, DetallePlan> = {
  prueba: {
    nombre: "Prueba gratis",
    precioUsd: 0,
    dias: 7,
    maxBarberos: null,
    recordatoriosAutomaticos: true,
    galeriaYResenas: true,
    herramientasPremium: true,
    incluye: ["Todo lo del plan Premium", "7 días sin costo", "Sin tarjeta de crédito"],
  },
  basico: {
    nombre: "Básico",
    precioUsd: 10,
    dias: 30,
    maxBarberos: 3,
    recordatoriosAutomaticos: false,
    galeriaYResenas: false,
    herramientasPremium: false,
    incluye: [
      "Web propia con reservas online",
      "Panel con agenda, clientes y precios",
      "Hasta 3 barberos",
      "Recordatorios por WhatsApp con un toque",
    ],
  },
  premium: {
    nombre: "Premium",
    precioUsd: 35,
    dias: 30,
    maxBarberos: null,
    recordatoriosAutomaticos: true,
    galeriaYResenas: true,
    herramientasPremium: true,
    incluye: [
      "Todo lo del plan Básico",
      "Barberos ilimitados",
      "Recordatorios automáticos por WhatsApp 2 horas antes",
      "Estadísticas: ingresos, servicios más vendidos y rendimiento por barbero",
      "Clientes por recuperar con mensaje de WhatsApp listo",
      "Promociones destacadas en tu web",
      "Exportar tus clientes a Excel",
      "Galería de trabajos y reseñas",
      "Web 100% con tu marca, sin la de Noir Studio",
    ],
  },
};
