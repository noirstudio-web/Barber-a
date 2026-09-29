CREATE TABLE "barberias" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"nombre" text NOT NULL,
	"eslogan" text DEFAULT '' NOT NULL,
	"descripcion" text DEFAULT '' NOT NULL,
	"whatsapp" text DEFAULT '' NOT NULL,
	"instagram" text DEFAULT '' NOT NULL,
	"direccion" text DEFAULT '' NOT NULL,
	"horario" jsonb NOT NULL,
	"logo" text,
	"portada" text,
	"plan" text DEFAULT 'prueba' NOT NULL,
	"vence_en" timestamp with time zone NOT NULL,
	"suspendida" boolean DEFAULT false NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "barberias" ("id", "slug", "nombre", "eslogan", "descripcion", "whatsapp", "instagram", "direccion", "horario", "portada", "plan", "vence_en") VALUES (1, 'filo', 'Filo Barber Club', 'Tu corte, a la hora que elijas.', 'Barbería en Chapinero. Cortes clásicos y modernos, arreglo de barba con toalla caliente y afeitado a navaja.', '573001234567', 'https://instagram.com/', 'Calle 63 # 9-42, Chapinero, Bogotá', '{"0":null,"1":{"abre":540,"cierra":1200},"2":{"abre":540,"cierra":1200},"3":{"abre":540,"cierra":1200},"4":{"abre":540,"cierra":1200},"5":{"abre":540,"cierra":1260},"6":{"abre":480,"cierra":1080}}', '/img/hero.jpg', 'premium', '2099-12-31T00:00:00Z');--> statement-breakpoint
SELECT setval(pg_get_serial_sequence('barberias', 'id'), 1);--> statement-breakpoint
CREATE TABLE "codigos" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo" text NOT NULL,
	"plan" text NOT NULL,
	"dias" integer NOT NULL,
	"nota" text DEFAULT '' NOT NULL,
	"barberia_id" integer,
	"usado_en" timestamp with time zone,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "galeria" (
	"id" serial PRIMARY KEY NOT NULL,
	"barberia_id" integer NOT NULL,
	"url" text NOT NULL,
	"alt" text DEFAULT '' NOT NULL,
	"ancho" integer DEFAULT 900 NOT NULL,
	"alto" integer DEFAULT 900 NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resenas" (
	"id" serial PRIMARY KEY NOT NULL,
	"barberia_id" integer NOT NULL,
	"nombre" text NOT NULL,
	"detalle" text DEFAULT '' NOT NULL,
	"texto" text NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bloqueos" DROP CONSTRAINT "bloqueos_barbero_id_barberos_id_fk";
--> statement-breakpoint
DROP INDEX "clientes_telefono_idx";--> statement-breakpoint
ALTER TABLE "barberos" ALTER COLUMN "estilo" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "barberos" ALTER COLUMN "foto" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "barberos" ADD COLUMN "barberia_id" integer;--> statement-breakpoint
UPDATE "barberos" SET "barberia_id" = 1;--> statement-breakpoint
ALTER TABLE "barberos" ALTER COLUMN "barberia_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "bloqueos" ADD COLUMN "barberia_id" integer;--> statement-breakpoint
UPDATE "bloqueos" SET "barberia_id" = 1;--> statement-breakpoint
ALTER TABLE "bloqueos" ALTER COLUMN "barberia_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "citas" ADD COLUMN "barberia_id" integer;--> statement-breakpoint
UPDATE "citas" SET "barberia_id" = 1;--> statement-breakpoint
ALTER TABLE "citas" ALTER COLUMN "barberia_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "clientes" ADD COLUMN "barberia_id" integer;--> statement-breakpoint
UPDATE "clientes" SET "barberia_id" = 1;--> statement-breakpoint
ALTER TABLE "clientes" ALTER COLUMN "barberia_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "servicios" ADD COLUMN "barberia_id" integer;--> statement-breakpoint
UPDATE "servicios" SET "barberia_id" = 1;--> statement-breakpoint
ALTER TABLE "servicios" ALTER COLUMN "barberia_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "barberia_id" integer;--> statement-breakpoint
UPDATE "usuarios" SET "barberia_id" = 1;--> statement-breakpoint
ALTER TABLE "codigos" ADD CONSTRAINT "codigos_barberia_id_barberias_id_fk" FOREIGN KEY ("barberia_id") REFERENCES "public"."barberias"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "galeria" ADD CONSTRAINT "galeria_barberia_id_barberias_id_fk" FOREIGN KEY ("barberia_id") REFERENCES "public"."barberias"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resenas" ADD CONSTRAINT "resenas_barberia_id_barberias_id_fk" FOREIGN KEY ("barberia_id") REFERENCES "public"."barberias"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "barberias_slug_idx" ON "barberias" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "codigos_codigo_idx" ON "codigos" USING btree ("codigo");--> statement-breakpoint
ALTER TABLE "barberos" ADD CONSTRAINT "barberos_barberia_id_barberias_id_fk" FOREIGN KEY ("barberia_id") REFERENCES "public"."barberias"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bloqueos" ADD CONSTRAINT "bloqueos_barberia_id_barberias_id_fk" FOREIGN KEY ("barberia_id") REFERENCES "public"."barberias"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bloqueos" ADD CONSTRAINT "bloqueos_barbero_id_barberos_id_fk" FOREIGN KEY ("barbero_id") REFERENCES "public"."barberos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citas" ADD CONSTRAINT "citas_barberia_id_barberias_id_fk" FOREIGN KEY ("barberia_id") REFERENCES "public"."barberias"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_barberia_id_barberias_id_fk" FOREIGN KEY ("barberia_id") REFERENCES "public"."barberias"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "servicios" ADD CONSTRAINT "servicios_barberia_id_barberias_id_fk" FOREIGN KEY ("barberia_id") REFERENCES "public"."barberias"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_barberia_id_barberias_id_fk" FOREIGN KEY ("barberia_id") REFERENCES "public"."barberias"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "barberos_barberia_idx" ON "barberos" USING btree ("barberia_id");--> statement-breakpoint
CREATE INDEX "citas_barberia_fecha_idx" ON "citas" USING btree ("barberia_id","fecha");--> statement-breakpoint
CREATE UNIQUE INDEX "clientes_barberia_telefono_idx" ON "clientes" USING btree ("barberia_id","telefono");--> statement-breakpoint
CREATE INDEX "servicios_barberia_idx" ON "servicios" USING btree ("barberia_id");