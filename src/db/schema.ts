import { boolean, index, integer, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

// Las citas y bloqueos guardan la fecha local del negocio ("2026-10-03") y los minutos
// desde medianoche. Así no hay conversiones de zona horaria en ningún cálculo.

export const barberos = pgTable("barberos", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  especialidad: text("especialidad").notNull(),
  estilo: text("estilo").notNull(),
  foto: text("foto").notNull(),
  activo: boolean("activo").notNull().default(true),
  orden: integer("orden").notNull().default(0),
});

export const servicios = pgTable("servicios", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion").notNull().default(""),
  duracionMin: integer("duracion_min").notNull(),
  precio: integer("precio").notNull(),
  activo: boolean("activo").notNull().default(true),
  orden: integer("orden").notNull().default(0),
});

export const clientes = pgTable(
  "clientes",
  {
    id: serial("id").primaryKey(),
    nombre: text("nombre").notNull(),
    telefono: text("telefono").notNull(),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("clientes_telefono_idx").on(t.telefono)],
);

export const ESTADOS_CITA = ["confirmada", "completada", "no_asistio", "cancelada"] as const;
export type EstadoCita = (typeof ESTADOS_CITA)[number];

export const citas = pgTable(
  "citas",
  {
    id: serial("id").primaryKey(),
    codigo: text("codigo").notNull(),
    clienteId: integer("cliente_id")
      .notNull()
      .references(() => clientes.id),
    barberoId: integer("barbero_id")
      .notNull()
      .references(() => barberos.id),
    servicioId: integer("servicio_id")
      .notNull()
      .references(() => servicios.id),
    fecha: text("fecha").notNull(),
    inicioMin: integer("inicio_min").notNull(),
    finMin: integer("fin_min").notNull(),
    // Copia del precio al momento de reservar, por si luego cambia el servicio
    precio: integer("precio").notNull(),
    estado: text("estado").$type<EstadoCita>().notNull().default("confirmada"),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("citas_barbero_fecha_idx").on(t.barberoId, t.fecha),
    index("citas_cliente_idx").on(t.clienteId),
    uniqueIndex("citas_codigo_idx").on(t.codigo),
  ],
);

// Un bloqueo aplica a cada día entre desde y hasta. Sin horas = día completo.
// Sin barbero = aplica a toda la barbería.
export const bloqueos = pgTable("bloqueos", {
  id: serial("id").primaryKey(),
  barberoId: integer("barbero_id").references(() => barberos.id),
  desde: text("desde").notNull(),
  hasta: text("hasta").notNull(),
  inicioMin: integer("inicio_min"),
  finMin: integer("fin_min"),
  motivo: text("motivo").notNull().default(""),
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
});

export type Barbero = typeof barberos.$inferSelect;
export type Servicio = typeof servicios.$inferSelect;
export type Cita = typeof citas.$inferSelect;
export type Bloqueo = typeof bloqueos.$inferSelect;
export type Cliente = typeof clientes.$inferSelect;
