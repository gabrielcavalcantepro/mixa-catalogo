import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Conta da equipe interna (founder/gestores). Sem autocadastro: contas
 * são criadas via seed/script. `role` existe para não exigir migration
 * quando permissões diferenciadas forem necessárias, mas hoje todo
 * usuário autenticado tem acesso completo igual.
 */
export const usuarios = pgTable("usuario", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  email: text("email").notNull().unique(),
  senhaHash: text("senha_hash").notNull(),
  role: text("role").notNull().default("gestor"),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

export type Usuario = typeof usuarios.$inferSelect;
export type NovoUsuario = typeof usuarios.$inferInsert;
