CREATE TABLE "usuarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"usuario" text NOT NULL,
	"clave_hash" text NOT NULL,
	"rol" text DEFAULT 'equipo' NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "barberos" ADD COLUMN "telefono" text;--> statement-breakpoint
ALTER TABLE "citas" ADD COLUMN "recordatorio_enviado" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "usuarios_usuario_idx" ON "usuarios" USING btree ("usuario");