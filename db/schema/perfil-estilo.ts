import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Entidade própria e editável (spec exige: não é lista fixa em código).
 * Seed inicial cobre as 4 sugestões da spec, mas a equipe pode
 * criar/editar/remover perfis pela tela própria.
 */
export const perfisEstilo = pgTable("perfil_estilo", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull().unique(),
  descricao: text("descricao"),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

export type PerfilEstilo = typeof perfisEstilo.$inferSelect;
export type NovoPerfilEstilo = typeof perfisEstilo.$inferInsert;
