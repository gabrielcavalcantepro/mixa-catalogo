import { date, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Entidade inferida (não explícita na spec): a spec descreve `capsula`
 * como "data ou nome de lançamento" na Peça, mas o Look precisa derivar
 * "a cápsula mais recente entre as peças" — isso exige uma data
 * comparável compartilhada entre peças da mesma cápsula, daí ser uma
 * entidade própria em vez de texto livre repetido peça a peça.
 */
export const capsulas = pgTable("capsula", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull().unique(),
  dataLancamento: date("data_lancamento", { mode: "date" }).notNull(),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

export type Capsula = typeof capsulas.$inferSelect;
export type NovaCapsula = typeof capsulas.$inferInsert;
