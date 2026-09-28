CREATE TABLE "barberos" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"especialidad" text NOT NULL,
	"estilo" text NOT NULL,
	"foto" text NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bloqueos" (
	"id" serial PRIMARY KEY NOT NULL,
	"barbero_id" integer,
	"desde" text NOT NULL,
	"hasta" text NOT NULL,
	"inicio_min" integer,
	"fin_min" integer,
	"motivo" text DEFAULT '' NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "citas" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo" text NOT NULL,
	"cliente_id" integer NOT NULL,
	"barbero_id" integer NOT NULL,
	"servicio_id" integer NOT NULL,
	"fecha" text NOT NULL,
	"inicio_min" integer NOT NULL,
	"fin_min" integer NOT NULL,
	"precio" integer NOT NULL,
	"estado" text DEFAULT 'confirmada' NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clientes" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"telefono" text NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "servicios" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"descripcion" text DEFAULT '' NOT NULL,
	"duracion_min" integer NOT NULL,
	"precio" integer NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bloqueos" ADD CONSTRAINT "bloqueos_barbero_id_barberos_id_fk" FOREIGN KEY ("barbero_id") REFERENCES "public"."barberos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citas" ADD CONSTRAINT "citas_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citas" ADD CONSTRAINT "citas_barbero_id_barberos_id_fk" FOREIGN KEY ("barbero_id") REFERENCES "public"."barberos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citas" ADD CONSTRAINT "citas_servicio_id_servicios_id_fk" FOREIGN KEY ("servicio_id") REFERENCES "public"."servicios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "citas_barbero_fecha_idx" ON "citas" USING btree ("barbero_id","fecha");--> statement-breakpoint
CREATE INDEX "citas_cliente_idx" ON "citas" USING btree ("cliente_id");--> statement-breakpoint
CREATE UNIQUE INDEX "citas_codigo_idx" ON "citas" USING btree ("codigo");--> statement-breakpoint
CREATE UNIQUE INDEX "clientes_telefono_idx" ON "clientes" USING btree ("telefono");