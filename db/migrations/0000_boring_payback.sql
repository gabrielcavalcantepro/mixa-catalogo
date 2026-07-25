CREATE TYPE "public"."cor_tipo" AS ENUM('neutra', 'destaque');--> statement-breakpoint
CREATE TYPE "public"."ocasiao" AS ENUM('trabalho', 'lazer', 'casa', 'treino', 'evento');--> statement-breakpoint
CREATE TYPE "public"."peso_clima" AS ENUM('leve', 'meia_estacao', 'pesada');--> statement-breakpoint
CREATE TYPE "public"."slot" AS ENUM('parte_de_cima', 'parte_de_baixo', 'peca_unica', 'calcado', 'sobreposicao', 'cinto', 'bolsa', 'acessorio_outro');--> statement-breakpoint
CREATE TABLE "usuario" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"email" text NOT NULL,
	"senha_hash" text NOT NULL,
	"role" text DEFAULT 'gestor' NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usuario_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "perfil_estilo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"descricao" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "perfil_estilo_nome_unique" UNIQUE("nome")
);
--> statement-breakpoint
CREATE TABLE "capsula" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"data_lancamento" date NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "peca_estilo" (
	"peca_id" uuid NOT NULL,
	"perfil_estilo_id" uuid NOT NULL,
	CONSTRAINT "peca_estilo_peca_id_perfil_estilo_id_pk" PRIMARY KEY("peca_id","perfil_estilo_id")
);
--> statement-breakpoint
CREATE TABLE "peca_imagem" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"peca_id" uuid NOT NULL,
	"url" text NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	"is_capa" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "peca_ocasiao_base" (
	"peca_id" uuid NOT NULL,
	"ocasiao" "ocasiao" NOT NULL,
	CONSTRAINT "peca_ocasiao_base_peca_id_ocasiao_pk" PRIMARY KEY("peca_id","ocasiao")
);
--> statement-breakpoint
CREATE TABLE "peca_peso_clima" (
	"peca_id" uuid NOT NULL,
	"peso_clima" "peso_clima" NOT NULL,
	CONSTRAINT "peca_peso_clima_peca_id_peso_clima_pk" PRIMARY KEY("peca_id","peso_clima")
);
--> statement-breakpoint
CREATE TABLE "peca" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"slot" "slot" NOT NULL,
	"cor_tipo" "cor_tipo" NOT NULL,
	"cor_valor" text NOT NULL,
	"peca_chave" boolean DEFAULT false NOT NULL,
	"capsula_id" uuid NOT NULL,
	"link_afiliado" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "look_ocasiao" (
	"look_id" uuid NOT NULL,
	"ocasiao" "ocasiao" NOT NULL,
	CONSTRAINT "look_ocasiao_look_id_ocasiao_pk" PRIMARY KEY("look_id","ocasiao")
);
--> statement-breakpoint
CREATE TABLE "look_peca" (
	"look_id" uuid NOT NULL,
	"slot" "slot" NOT NULL,
	"peca_id" uuid NOT NULL,
	CONSTRAINT "look_peca_look_id_slot_pk" PRIMARY KEY("look_id","slot")
);
--> statement-breakpoint
CREATE TABLE "look_perfil_estilo" (
	"look_id" uuid NOT NULL,
	"perfil_estilo_id" uuid NOT NULL,
	CONSTRAINT "look_perfil_estilo_look_id_perfil_estilo_id_pk" PRIMARY KEY("look_id","perfil_estilo_id")
);
--> statement-breakpoint
CREATE TABLE "look_slot_trocado" (
	"look_id" uuid NOT NULL,
	"slot" "slot" NOT NULL,
	CONSTRAINT "look_slot_trocado_look_id_slot_pk" PRIMARY KEY("look_id","slot")
);
--> statement-breakpoint
CREATE TABLE "look" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text,
	"capsula_id" uuid NOT NULL,
	"variante_de_id" uuid,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "peca_estilo" ADD CONSTRAINT "peca_estilo_peca_id_peca_id_fk" FOREIGN KEY ("peca_id") REFERENCES "public"."peca"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peca_estilo" ADD CONSTRAINT "peca_estilo_perfil_estilo_id_perfil_estilo_id_fk" FOREIGN KEY ("perfil_estilo_id") REFERENCES "public"."perfil_estilo"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peca_imagem" ADD CONSTRAINT "peca_imagem_peca_id_peca_id_fk" FOREIGN KEY ("peca_id") REFERENCES "public"."peca"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peca_ocasiao_base" ADD CONSTRAINT "peca_ocasiao_base_peca_id_peca_id_fk" FOREIGN KEY ("peca_id") REFERENCES "public"."peca"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peca_peso_clima" ADD CONSTRAINT "peca_peso_clima_peca_id_peca_id_fk" FOREIGN KEY ("peca_id") REFERENCES "public"."peca"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peca" ADD CONSTRAINT "peca_capsula_id_capsula_id_fk" FOREIGN KEY ("capsula_id") REFERENCES "public"."capsula"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "look_ocasiao" ADD CONSTRAINT "look_ocasiao_look_id_look_id_fk" FOREIGN KEY ("look_id") REFERENCES "public"."look"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "look_peca" ADD CONSTRAINT "look_peca_look_id_look_id_fk" FOREIGN KEY ("look_id") REFERENCES "public"."look"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "look_peca" ADD CONSTRAINT "look_peca_peca_id_peca_id_fk" FOREIGN KEY ("peca_id") REFERENCES "public"."peca"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "look_perfil_estilo" ADD CONSTRAINT "look_perfil_estilo_look_id_look_id_fk" FOREIGN KEY ("look_id") REFERENCES "public"."look"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "look_perfil_estilo" ADD CONSTRAINT "look_perfil_estilo_perfil_estilo_id_perfil_estilo_id_fk" FOREIGN KEY ("perfil_estilo_id") REFERENCES "public"."perfil_estilo"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "look_slot_trocado" ADD CONSTRAINT "look_slot_trocado_look_id_look_id_fk" FOREIGN KEY ("look_id") REFERENCES "public"."look"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "look" ADD CONSTRAINT "look_capsula_id_capsula_id_fk" FOREIGN KEY ("capsula_id") REFERENCES "public"."capsula"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "look" ADD CONSTRAINT "look_variante_de_id_look_id_fk" FOREIGN KEY ("variante_de_id") REFERENCES "public"."look"("id") ON DELETE no action ON UPDATE no action;