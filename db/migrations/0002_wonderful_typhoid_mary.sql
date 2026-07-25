CREATE TYPE "public"."look_candidato_status" AS ENUM('pendente', 'descartado');--> statement-breakpoint
CREATE TABLE "look_clima" (
	"look_id" uuid NOT NULL,
	"peso_clima" "peso_clima" NOT NULL,
	CONSTRAINT "look_clima_look_id_peso_clima_pk" PRIMARY KEY("look_id","peso_clima")
);
--> statement-breakpoint
CREATE TABLE "look_candidato_clima" (
	"candidato_id" uuid NOT NULL,
	"peso_clima" "peso_clima" NOT NULL,
	CONSTRAINT "look_candidato_clima_candidato_id_peso_clima_pk" PRIMARY KEY("candidato_id","peso_clima")
);
--> statement-breakpoint
CREATE TABLE "look_candidato_ocasiao_sugerida" (
	"candidato_id" uuid NOT NULL,
	"ocasiao" "ocasiao" NOT NULL,
	CONSTRAINT "look_candidato_ocasiao_sugerida_candidato_id_ocasiao_pk" PRIMARY KEY("candidato_id","ocasiao")
);
--> statement-breakpoint
CREATE TABLE "look_candidato_peca" (
	"candidato_id" uuid NOT NULL,
	"slot" "slot" NOT NULL,
	"peca_id" uuid NOT NULL,
	CONSTRAINT "look_candidato_peca_candidato_id_slot_pk" PRIMARY KEY("candidato_id","slot")
);
--> statement-breakpoint
CREATE TABLE "look_candidato_perfil_sugerido" (
	"candidato_id" uuid NOT NULL,
	"perfil_estilo_id" uuid NOT NULL,
	CONSTRAINT "look_candidato_perfil_sugerido_candidato_id_perfil_estilo_id_pk" PRIMARY KEY("candidato_id","perfil_estilo_id")
);
--> statement-breakpoint
CREATE TABLE "look_candidato" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fingerprint" text NOT NULL,
	"status" "look_candidato_status" DEFAULT 'pendente' NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "look_candidato_fingerprint_unique" UNIQUE("fingerprint")
);
--> statement-breakpoint
ALTER TABLE "look" ADD COLUMN "clima_misto" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "look_clima" ADD CONSTRAINT "look_clima_look_id_look_id_fk" FOREIGN KEY ("look_id") REFERENCES "public"."look"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "look_candidato_clima" ADD CONSTRAINT "look_candidato_clima_candidato_id_look_candidato_id_fk" FOREIGN KEY ("candidato_id") REFERENCES "public"."look_candidato"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "look_candidato_ocasiao_sugerida" ADD CONSTRAINT "look_candidato_ocasiao_sugerida_candidato_id_look_candidato_id_fk" FOREIGN KEY ("candidato_id") REFERENCES "public"."look_candidato"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "look_candidato_peca" ADD CONSTRAINT "look_candidato_peca_candidato_id_look_candidato_id_fk" FOREIGN KEY ("candidato_id") REFERENCES "public"."look_candidato"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "look_candidato_peca" ADD CONSTRAINT "look_candidato_peca_peca_id_peca_id_fk" FOREIGN KEY ("peca_id") REFERENCES "public"."peca"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "look_candidato_perfil_sugerido" ADD CONSTRAINT "look_candidato_perfil_sugerido_candidato_id_look_candidato_id_fk" FOREIGN KEY ("candidato_id") REFERENCES "public"."look_candidato"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "look_candidato_perfil_sugerido" ADD CONSTRAINT "look_candidato_perfil_sugerido_perfil_estilo_id_perfil_estilo_id_fk" FOREIGN KEY ("perfil_estilo_id") REFERENCES "public"."perfil_estilo"("id") ON DELETE no action ON UPDATE no action;