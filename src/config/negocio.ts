// Datos del negocio. Para adaptar la web a otra barbería, casi todo se cambia aquí.

export const negocio = {
  nombre: "Filo Barber Club",
  // Marca que se ve en el menú, el pie de página y el panel.
  // Por ahora muestra Noir Studio; para un cliente real, pon aquí su nombre y su logo.
  marca: {
    nombre: "Noir",
    subtitulo: "Studio",
    logo: "/noir-studio/noir-app-icon.png" as string | null,
  },
  eslogan: "Cortes con oficio. Reserva en un minuto.",
  descripcion:
    "Barbería en Chapinero. Cortes clásicos y modernos, arreglo de barba con toalla caliente y afeitado a navaja.",
  // Número en formato internacional, sin "+" ni espacios (lo usa wa.me)
  whatsapp: "573001234567",
  telefonoVisible: "+57 300 123 4567",
  // Indicativo que se antepone a los celulares de los clientes para escribirles por WhatsApp
  indicativo: "57",
  instagram: "https://instagram.com/",
  direccion: "Calle 63 # 9-42, Chapinero, Bogotá",
  // Búsqueda que usa Google Maps para el mapa y el botón "Cómo llegar"
  mapsQuery: "Calle 63 9-42, Bogotá, Colombia",
  zonaHoraria: "America/Bogota",
  moneda: "COP",
  locale: "es-CO",
} as const;

// Horario de atención. 0 = domingo ... 6 = sábado. null = cerrado.
// Las horas van en minutos desde medianoche para simplificar los cálculos.
export const horario: Record<number, { abre: number; cierra: number } | null> = {
  0: null,
  1: { abre: 9 * 60, cierra: 20 * 60 },
  2: { abre: 9 * 60, cierra: 20 * 60 },
  3: { abre: 9 * 60, cierra: 20 * 60 },
  4: { abre: 9 * 60, cierra: 20 * 60 },
  5: { abre: 9 * 60, cierra: 21 * 60 },
  6: { abre: 8 * 60, cierra: 18 * 60 },
};

export const reservas = {
  // Cada cuántos minutos se ofrece una hora de inicio
  intervaloMin: 15,
  // Tiempo mínimo entre "ahora" y la cita
  antelacionMin: 60,
  // Hasta cuántos días hacia adelante se puede reservar
  diasMaximos: 30,
};

export const nombresDias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
