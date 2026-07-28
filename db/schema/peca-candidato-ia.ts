import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { corTipoEnum, ocasiaoEnum, pesoClimaEnum, slotEnum } from "./enums";
import { capsulas } from "./capsula";
import { perfisEstilo } from "./perfil-estilo";
import { pecas } from "./peca";

/**
 * Candidato a peça gerado pela busca assistida por IA
 * (`app/(dashboard)/pecas-ia/`). Espelha o desenho de `peca` (mesmos
 * campos, mesmas tabelas de junção pra clima/ocasião/estilo), mas
 * ainda não é peça de verdade até o admin aprovar — nunca aprovação
 * automática. Linha nunca é apagada (histórico) — `status` cobre todo
 * o ciclo: `pendente` (na fila de revisão) → `aprovado` (virou peça,
 * `pecaIdResultante` preenchido) ou `rejeitado` (automático, com
 * `motivoRejeicaoAutomatica`, ou manual pelo admin na revisão) →
 * `desfeito` (era `aprovado`, admin decidiu apagar a peça depois).
 */
export const pecaCandidatoIaStatusEnum = pgEnum("peca_candidato_ia_status", [
  "pendente",
  "aprovado",
  "rejeitado",
  "desfeito",
]);

export const pecaCandidatosIa = pgTable("peca_candidato_ia", {
  id: uuid("id").primaryKey().defaultRandom(),
  perfilEstiloId: uuid("perfil_estilo_id")
    .notNull()
    .references(() => perfisEstilo.id),
  status: pecaCandidatoIaStatusEnum("status").notNull().default("pendente"),
  motivoRejeicaoAutomatica: text("motivo_rejeicao_automatica"),
  nome: text("nome").notNull(),
  slot: slotEnum("slot").notNull(),
  corTipo: corTipoEnum("cor_tipo").notNull(),
  corValor: text("cor_valor").notNull(),
  capsulaId: uuid("capsula_id").references(() => capsulas.id),
  pecaChave: boolean("peca_chave").notNull().default(false),
  linkAfiliado: text("link_afiliado"),
  imagemUrl: text("imagem_url"),
  linkOrigemImagem: text("link_origem_imagem"),
  numeroCombinacoes: integer("numero_combinacoes"),
  pecaIdResultante: uuid("peca_id_resultante").references(() => pecas.id),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  decididoEm: timestamp("decidido_em", { withTimezone: true }),
});

export const pecaCandidatoIaPesoClima = pgTable(
  "peca_candidato_ia_peso_clima",
  {
    candidatoId: uuid("candidato_id")
      .notNull()
      .references(() => pecaCandidatosIa.id, { onDelete: "cascade" }),
    pesoClima: pesoClimaEnum("peso_clima").notNull(),
  },
  (t) => [primaryKey({ columns: [t.candidatoId, t.pesoClima] })],
);

export const pecaCandidatoIaOcasiaoBase = pgTable(
  "peca_candidato_ia_ocasiao_base",
  {
    candidatoId: uuid("candidato_id")
      .notNull()
      .references(() => pecaCandidatosIa.id, { onDelete: "cascade" }),
    ocasiao: ocasiaoEnum("ocasiao").notNull(),
  },
  (t) => [primaryKey({ columns: [t.candidatoId, t.ocasiao] })],
);

export const pecaCandidatoIaEstilo = pgTable(
  "peca_candidato_ia_estilo",
  {
    candidatoId: uuid("candidato_id")
      .notNull()
      .references(() => pecaCandidatosIa.id, { onDelete: "cascade" }),
    perfilEstiloId: uuid("perfil_estilo_id")
      .notNull()
      .references(() => perfisEstilo.id),
  },
  (t) => [primaryKey({ columns: [t.candidatoId, t.perfilEstiloId] })],
);

export type PecaCandidatoIa = typeof pecaCandidatosIa.$inferSelect;
export type NovoPecaCandidatoIa = typeof pecaCandidatosIa.$inferInsert;
