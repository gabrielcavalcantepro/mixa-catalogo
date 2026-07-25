import { pgEnum, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { ocasiaoEnum, pesoClimaEnum, slotEnum } from "./enums";
import { pecas } from "./peca";
import { perfisEstilo } from "./perfil-estilo";

/**
 * Candidato de look gerado pelo motor de sugestão (regra, sem IA — ver
 * sugestoes-de-look/_lib/gerar-candidatos.ts). Espelha o desenho de
 * `look`+suas tabelas de junção, mas ainda não é um Look de verdade até
 * ser aprovado (looks/_actions/aprovar-candidato.ts) — a linha nunca é
 * apagada (nem quando aprovado, nem quando reprovado): é assim que o
 * `fingerprint` (único) continua bloqueando o motor de recriar a mesma
 * combinação numa geração futura, e que o candidato reprovado pode ser
 * reaberto (`reabrir-candidato.ts`) sem perder o que foi gerado.
 */
export const lookCandidatoStatusEnum = pgEnum("look_candidato_status", [
  "pendente",
  "aprovado",
  "reprovado",
]);

export const lookCandidatos = pgTable("look_candidato", {
  id: uuid("id").primaryKey().defaultRandom(),
  fingerprint: text("fingerprint").notNull().unique(),
  status: lookCandidatoStatusEnum("status").notNull().default("pendente"),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

export const lookCandidatoPecas = pgTable(
  "look_candidato_peca",
  {
    candidatoId: uuid("candidato_id")
      .notNull()
      .references(() => lookCandidatos.id, { onDelete: "cascade" }),
    slot: slotEnum("slot").notNull(),
    pecaId: uuid("peca_id")
      .notNull()
      .references(() => pecas.id),
  },
  (t) => [primaryKey({ columns: [t.candidatoId, t.slot] })],
);

/** Clima derivado do candidato (sempre não-vazio — geração exige clima em comum). */
export const lookCandidatoClimas = pgTable(
  "look_candidato_clima",
  {
    candidatoId: uuid("candidato_id")
      .notNull()
      .references(() => lookCandidatos.id, { onDelete: "cascade" }),
    pesoClima: pesoClimaEnum("peso_clima").notNull(),
  },
  (t) => [primaryKey({ columns: [t.candidatoId, t.pesoClima] })],
);

/** Ocasião sugerida (interseção das peças envolvidas) — editável antes de aprovar. */
export const lookCandidatoOcasioesSugeridas = pgTable(
  "look_candidato_ocasiao_sugerida",
  {
    candidatoId: uuid("candidato_id")
      .notNull()
      .references(() => lookCandidatos.id, { onDelete: "cascade" }),
    ocasiao: ocasiaoEnum("ocasiao").notNull(),
  },
  (t) => [primaryKey({ columns: [t.candidatoId, t.ocasiao] })],
);

/** Perfil de estilo sugerido (interseção, pode vir vazia) — editável antes de aprovar. */
export const lookCandidatoPerfisSugeridos = pgTable(
  "look_candidato_perfil_sugerido",
  {
    candidatoId: uuid("candidato_id")
      .notNull()
      .references(() => lookCandidatos.id, { onDelete: "cascade" }),
    perfilEstiloId: uuid("perfil_estilo_id")
      .notNull()
      .references(() => perfisEstilo.id),
  },
  (t) => [primaryKey({ columns: [t.candidatoId, t.perfilEstiloId] })],
);

export type LookCandidato = typeof lookCandidatos.$inferSelect;
export type NovoLookCandidato = typeof lookCandidatos.$inferInsert;
