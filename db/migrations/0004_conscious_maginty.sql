CREATE TYPE "public"."peca_candidato_ia_status" AS ENUM('pendente', 'aprovado', 'rejeitado', 'desfeito');--> statement-breakpoint
CREATE TABLE "peca_candidato_ia_estilo" (
	"candidato_id" uuid NOT NULL,
	"perfil_estilo_id" uuid NOT NULL,
	CONSTRAINT "peca_candidato_ia_estilo_candidato_id_perfil_estilo_id_pk" PRIMARY KEY("candidato_id","perfil_estilo_id")
);
--> statement-breakpoint
CREATE TABLE "peca_candidato_ia_ocasiao_base" (
	"candidato_id" uuid NOT NULL,
	"ocasiao" "ocasiao" NOT NULL,
	CONSTRAINT "peca_candidato_ia_ocasiao_base_candidato_id_ocasiao_pk" PRIMARY KEY("candidato_id","ocasiao")
);
--> statement-breakpoint
CREATE TABLE "peca_candidato_ia_peso_clima" (
	"candidato_id" uuid NOT NULL,
	"peso_clima" "peso_clima" NOT NULL,
	CONSTRAINT "peca_candidato_ia_peso_clima_candidato_id_peso_clima_pk" PRIMARY KEY("candidato_id","peso_clima")
);
--> statement-breakpoint
CREATE TABLE "peca_candidato_ia" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"perfil_estilo_id" uuid NOT NULL,
	"status" "peca_candidato_ia_status" DEFAULT 'pendente' NOT NULL,
	"motivo_rejeicao_automatica" text,
	"nome" text NOT NULL,
	"slot" "slot" NOT NULL,
	"cor_tipo" "cor_tipo" NOT NULL,
	"cor_valor" text NOT NULL,
	"capsula_id" uuid,
	"peca_chave" boolean DEFAULT false NOT NULL,
	"link_afiliado" text,
	"imagem_url" text,
	"link_origem_imagem" text,
	"numero_combinacoes" integer,
	"peca_id_resultante" uuid,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"decidido_em" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "busca_ia_observacao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"texto" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "peca_candidato_ia_estilo" ADD CONSTRAINT "peca_candidato_ia_estilo_candidato_id_peca_candidato_ia_id_fk" FOREIGN KEY ("candidato_id") REFERENCES "public"."peca_candidato_ia"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peca_candidato_ia_estilo" ADD CONSTRAINT "peca_candidato_ia_estilo_perfil_estilo_id_perfil_estilo_id_fk" FOREIGN KEY ("perfil_estilo_id") REFERENCES "public"."perfil_estilo"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peca_candidato_ia_ocasiao_base" ADD CONSTRAINT "peca_candidato_ia_ocasiao_base_candidato_id_peca_candidato_ia_id_fk" FOREIGN KEY ("candidato_id") REFERENCES "public"."peca_candidato_ia"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peca_candidato_ia_peso_clima" ADD CONSTRAINT "peca_candidato_ia_peso_clima_candidato_id_peca_candidato_ia_id_fk" FOREIGN KEY ("candidato_id") REFERENCES "public"."peca_candidato_ia"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peca_candidato_ia" ADD CONSTRAINT "peca_candidato_ia_perfil_estilo_id_perfil_estilo_id_fk" FOREIGN KEY ("perfil_estilo_id") REFERENCES "public"."perfil_estilo"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peca_candidato_ia" ADD CONSTRAINT "peca_candidato_ia_capsula_id_capsula_id_fk" FOREIGN KEY ("capsula_id") REFERENCES "public"."capsula"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peca_candidato_ia" ADD CONSTRAINT "peca_candidato_ia_peca_id_resultante_peca_id_fk" FOREIGN KEY ("peca_id_resultante") REFERENCES "public"."peca"("id") ON DELETE no action ON UPDATE no action;