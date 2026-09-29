CREATE TABLE "pagos" (
	"id" serial PRIMARY KEY NOT NULL,
	"barberia_id" integer,
	"codigo_id" integer,
	"cliente" text DEFAULT '' NOT NULL,
	"plan" text NOT NULL,
	"monto_centavos" integer NOT NULL,
	"metodo" text DEFAULT 'Otro' NOT NULL,
	"referencia" text DEFAULT '' NOT NULL,
	"fecha" timestamp with time zone DEFAULT now() NOT NULL,
	"registrado_por" integer
);
--> statement-breakpoint
ALTER TABLE "barberias" ADD COLUMN "cancelada_en" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "barberias" ADD COLUMN "motivo_cancelacion" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_barberia_id_barberias_id_fk" FOREIGN KEY ("barberia_id") REFERENCES "public"."barberias"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_codigo_id_codigos_id_fk" FOREIGN KEY ("codigo_id") REFERENCES "public"."codigos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_registrado_por_usuarios_id_fk" FOREIGN KEY ("registrado_por") REFERENCES "public"."usuarios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pagos_barberia_idx" ON "pagos" USING btree ("barberia_id");--> statement-breakpoint
CREATE INDEX "pagos_fecha_idx" ON "pagos" USING btree ("fecha");