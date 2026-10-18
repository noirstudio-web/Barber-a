// Planes de suscripción de la plataforma. Cambia aquí precios, duración y límites.

export const PLANES = ["prueba", "basico", "premium"] as const;
export type Plan = (typeof PLANES)[number];

export type DetallePlan = {
  nombre: string;
  // Precio mensual en pesos colombianos (lo que cobra Mercado Pago)
  precio: number;
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
    precio: 0,
    dias: 7,
    maxBarberos: null,
    recordatoriosAutomaticos: true,
    galeriaYResenas: true,
    herramientasPremium: true,
    incluye: ["Todo lo del plan Premium", "7 días sin costo", "Sin tarjeta de crédito"],
  },
  basico: {
    nombre: "Básico",
    precio: 40000,
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
    precio: 140000,
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

// Medios de pago que se pueden registrar en el panel de Noir
export const METODOS_PAGO = ["Mercado Pago", "Nequi", "Daviplata", "Bancolombia", "Transferencia", "Efectivo", "PayPal", "Otro"] as const;

export const MONEDAS = ["COP", "USD"] as const;
export type Moneda = (typeof MONEDAS)[number];

// 40000 -> "40.000 COP"
export function fmtPrecio(valor: number, moneda: Moneda = "COP") {
  return `${new Intl.NumberFormat("es-CO", { maximumFractionDigits: moneda === "COP" ? 0 : 2 }).format(valor)} ${moneda}`;
}

// Suma montos (en centavos) de varias monedas: "560.000 COP + 35 USD"
export function fmtTotales(lista: { montoCentavos: number; moneda: Moneda }[]) {
  const porMoneda = new Map<Moneda, number>();
  for (const p of lista) porMoneda.set(p.moneda, (porMoneda.get(p.moneda) ?? 0) + p.montoCentavos);
  if (porMoneda.size === 0) return fmtPrecio(0);
  return [...porMoneda.entries()].map(([m, c]) => fmtPrecio(c / 100, m)).join(" + ");
}
