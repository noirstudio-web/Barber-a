import { boolean, index, integer, jsonb, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import type { Plan } from "@/config/planes";
import type { Horario } from "@/config/region";

// Plataforma multi-barbería: cada tabla de negocio lleva barberia_id.
// Las citas y bloqueos guardan la fecha local ("2026-10-03") y los minutos desde medianoche.
// Así no hay conversiones de zona horaria en ningún cálculo.

export const barberias = pgTable(
  "barberias",
  {
    id: serial("id").primaryKey(),
    // Dirección pública: dominio.com/<slug>
    slug: text("slug").notNull(),
    nombre: text("nombre").notNull(),
    eslogan: text("eslogan").notNull().default(""),
    descripcion: text("descripcion").notNull().default(""),
    // WhatsApp del negocio en formato internacional, solo dígitos
    whatsapp: text("whatsapp").notNull().default(""),
    instagram: text("instagram").notNull().default(""),
    direccion: text("direccion").notNull().default(""),
    horario: jsonb("horario").$type<Horario>().notNull(),
    logo: text("logo"),
    portada: text("portada"),
    plan: text("plan").$type<Plan>().notNull().default("prueba"),
    venceEn: timestamp("vence_en", { withTimezone: true }).notNull(),
    suspendida: boolean("suspendida").notNull().default(false),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("barberias_slug_idx").on(t.slug)],
);

const barberiaId = () =>
  integer("barberia_id")
    .notNull()
    .references(() => barberias.id, { onDelete: "cascade" });

export const barberos = pgTable(
  "barberos",
  {
    id: serial("id").primaryKey(),
    barberiaId: barberiaId(),
    nombre: text("nombre").notNull(),
    especialidad: text("especialidad").notNull(),
    estilo: text("estilo").notNull().default(""),
    foto: text("foto"),
    // Celular del barbero para avisos por WhatsApp (formato internacional, solo dígitos)
    telefono: text("telefono"),
    activo: boolean("activo").notNull().default(true),
    orden: integer("orden").notNull().default(0),
  },
  (t) => [index("barberos_barberia_idx").on(t.barberiaId)],
);

export const servicios = pgTable(
  "servicios",
  {
    id: serial("id").primaryKey(),
    barberiaId: barberiaId(),
    nombre: text("nombre").notNull(),
    descripcion: text("descripcion").notNull().default(""),
    duracionMin: integer("duracion_min").notNull(),
    precio: integer("precio").notNull(),
    activo: boolean("activo").notNull().default(true),
    orden: integer("orden").notNull().default(0),
  },
  (t) => [index("servicios_barberia_idx").on(t.barberiaId)],
);

export const clientes = pgTable(
  "clientes",
  {
    id: serial("id").primaryKey(),
    barberiaId: barberiaId(),
    nombre: text("nombre").notNull(),
    telefono: text("telefono").notNull(),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("clientes_barberia_telefono_idx").on(t.barberiaId, t.telefono)],
);

export const ESTADOS_CITA = ["confirmada", "completada", "no_asistio", "cancelada"] as const;
export type EstadoCita = (typeof ESTADOS_CITA)[number];

export const citas = pgTable(
  "citas",
  {
    id: serial("id").primaryKey(),
    barberiaId: barberiaId(),
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
    // Cuándo se envió el recordatorio previo a la cita (null = pendiente)
    recordatorioEnviado: timestamp("recordatorio_enviado", { withTimezone: true }),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("citas_barbero_fecha_idx").on(t.barberoId, t.fecha),
    index("citas_barberia_fecha_idx").on(t.barberiaId, t.fecha),
    index("citas_cliente_idx").on(t.clienteId),
    uniqueIndex("citas_codigo_idx").on(t.codigo),
  ],
);

// Un bloqueo aplica a cada día entre desde y hasta. Sin horas = día completo.
// Sin barbero = aplica a toda la barbería.
export const bloqueos = pgTable("bloqueos", {
  id: serial("id").primaryKey(),
  barberiaId: barberiaId(),
  barberoId: integer("barbero_id").references(() => barberos.id, { onDelete: "cascade" }),
  desde: text("desde").notNull(),
  hasta: text("hasta").notNull(),
  inicioMin: integer("inicio_min"),
  finMin: integer("fin_min"),
  motivo: text("motivo").notNull().default(""),
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
});

export const galeria = pgTable("galeria", {
  id: serial("id").primaryKey(),
  barberiaId: barberiaId(),
  url: text("url").notNull(),
  alt: text("alt").notNull().default(""),
  ancho: integer("ancho").notNull().default(900),
  alto: integer("alto").notNull().default(900),
  orden: integer("orden").notNull().default(0),
});

export const resenas = pgTable("resenas", {
  id: serial("id").primaryKey(),
  barberiaId: barberiaId(),
  nombre: text("nombre").notNull(),
  detalle: text("detalle").notNull().default(""),
  texto: text("texto").notNull(),
  orden: integer("orden").notNull().default(0),
});

// "noir" = equipo de Noir Studio (panel de la plataforma, sin barbería)
export const ROLES = ["dueno", "equipo", "noir"] as const;
export type Rol = (typeof ROLES)[number];

export const usuarios = pgTable(
  "usuarios",
  {
    id: serial("id").primaryKey(),
    barberiaId: integer("barberia_id").references(() => barberias.id, { onDelete: "cascade" }),
    nombre: text("nombre").notNull(),
    usuario: text("usuario").notNull(),
    claveHash: text("clave_hash").notNull(),
    rol: text("rol").$type<Rol>().notNull().default("equipo"),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("usuarios_usuario_idx").on(t.usuario)],
);

// Códigos que Noir Studio entrega al vender un plan. Sirven para crear una barbería
// nueva o para renovar/cambiar el plan de una existente.
export const codigos = pgTable(
  "codigos",
  {
    id: serial("id").primaryKey(),
    codigo: text("codigo").notNull(),
    plan: text("plan").$type<Plan>().notNull(),
    dias: integer("dias").notNull(),
    nota: text("nota").notNull().default(""),
    barberiaId: integer("barberia_id").references(() => barberias.id, { onDelete: "set null" }),
    usadoEn: timestamp("usado_en", { withTimezone: true }),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("codigos_codigo_idx").on(t.codigo)],
);

export type Barberia = typeof barberias.$inferSelect;
export type Usuario = typeof usuarios.$inferSelect;
export type Barbero = typeof barberos.$inferSelect;
export type Servicio = typeof servicios.$inferSelect;
export type Cita = typeof citas.$inferSelect;
export type Bloqueo = typeof bloqueos.$inferSelect;
export type Cliente = typeof clientes.$inferSelect;
export type Codigo = typeof codigos.$inferSelect;
