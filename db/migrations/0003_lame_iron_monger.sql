ALTER TABLE "look_candidato" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "look_candidato" ALTER COLUMN "status" SET DEFAULT 'pendente'::text;--> statement-breakpoint
DROP TYPE "public"."look_candidato_status";--> statement-breakpoint
CREATE TYPE "public"."look_candidato_status" AS ENUM('pendente', 'aprovado', 'reprovado');--> statement-breakpoint
ALTER TABLE "look_candidato" ALTER COLUMN "status" SET DEFAULT 'pendente'::"public"."look_candidato_status";--> statement-breakpoint
ALTER TABLE "look_candidato" ALTER COLUMN "status" SET DATA TYPE "public"."look_candidato_status" USING "status"::"public"."look_candidato_status";