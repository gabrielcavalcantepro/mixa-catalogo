import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Anotação livre do admin sobre a busca de peça por IA (ex.: "essa cor
 * não combina com a marca") — sem vínculo com perfil de estilo
 * específico, feedback costuma valer em geral. As mais recentes
 * entram como contexto no prompt da próxima geração (ver
 * `pecas-ia/_actions/gerar-candidatos-ia.ts`), não o histórico inteiro.
 */
export const buscaIaObservacoes = pgTable("busca_ia_observacao", {
  id: uuid("id").primaryKey().defaultRandom(),
  texto: text("texto").notNull(),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

export type BuscaIaObservacao = typeof buscaIaObservacoes.$inferSelect;
export type NovaBuscaIaObservacao = typeof buscaIaObservacoes.$inferInsert;
