import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Continua sendo tabela (peça e look referenciam por id), mas os 7
 * perfis são fixos (decisão de produto, 2026-07-25) — sem tela de
 * administrar (criar/editar/apagar). Únicos valores válidos: Esportivo,
 * Tradicional, Elegante, Romântico, Criativo, Sexy, Dramático urbano
 * (ver `db/seed.ts`).
 */
export const perfisEstilo = pgTable("perfil_estilo", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull().unique(),
  descricao: text("descricao"),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

export type PerfilEstilo = typeof perfisEstilo.$inferSelect;
export type NovoPerfilEstilo = typeof perfisEstilo.$inferInsert;
