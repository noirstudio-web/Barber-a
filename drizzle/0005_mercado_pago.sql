CREATE TABLE "compras" (
	"id" text PRIMARY KEY NOT NULL,
	"plan" text NOT NULL,
	"nombre" text NOT NULL,
	"email" text NOT NULL,
	"whatsapp" text DEFAULT '' NOT NULL,
	"estado" text DEFAULT 'pendiente' NOT NULL,
	"codigo_id" integer,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "barberias" ADD COLUMN "mp_suscripcion_id" text;--> statement-breakpoint
ALTER TABLE "barberias" ADD COLUMN "mp_suscripcion_estado" text;--> statement-breakpoint
ALTER TABLE "barberias" ADD COLUMN "mp_suscripcion_plan" text;--> statement-breakpoint
ALTER TABLE "pagos" ADD COLUMN "moneda" text DEFAULT 'COP' NOT NULL;--> statement-breakpoint
UPDATE "pagos" SET "moneda" = 'USD';--> statement-breakpoint
ALTER TABLE "pagos" ADD COLUMN "mp_pago_id" text;--> statement-breakpoint
ALTER TABLE "compras" ADD CONSTRAINT "compras_codigo_id_codigos_id_fk" FOREIGN KEY ("codigo_id") REFERENCES "public"."codigos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "pagos_mp_pago_idx" ON "pagos" USING btree ("mp_pago_id");--> statement-breakpoint
ALTER TABLE "barberias" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "barberos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "servicios" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "clientes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "citas" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "bloqueos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "galeria" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "resenas" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "usuarios" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "codigos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "pagos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "compras" ENABLE ROW LEVEL SECURITY;