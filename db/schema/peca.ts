import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { corTipoEnum, ocasiaoEnum, pesoClimaEnum, slotEnum } from "./enums";
import { capsulas } from "./capsula";
import { perfisEstilo } from "./perfil-estilo";

/**
 * Unidade atômica do catálogo. `nome` não está na spec original, mas é
 * necessário para identificar peças em listas/selects e permitir busca
 * textual (assumido, sinalizado ao usuário no plano).
 */
export const pecas = pgTable("peca", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  slot: slotEnum("slot").notNull(),
  corTipo: corTipoEnum("cor_tipo").notNull(),
  corValor: text("cor_valor").notNull(),
  pecaChave: boolean("peca_chave").notNull().default(false),
  capsulaId: uuid("capsula_id")
    .notNull()
    .references(() => capsulas.id),
  linkAfiliado: text("link_afiliado"),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Uma ou mais imagens por peça; `isCapa` marca a usada no grid/colagem do look. */
export const pecaImagens = pgTable("peca_imagem", {
  id: uuid("id").primaryKey().defaultRandom(),
  pecaId: uuid("peca_id")
    .notNull()
    .references(() => pecas.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  ordem: integer("ordem").notNull().default(0),
  isCapa: boolean("is_capa").notNull().default(false),
});

export const pecaPesoClima = pgTable(
  "peca_peso_clima",
  {
    pecaId: uuid("peca_id")
      .notNull()
      .references(() => pecas.id, { onDelete: "cascade" }),
    pesoClima: pesoClimaEnum("peso_clima").notNull(),
  },
  (t) => [primaryKey({ columns: [t.pecaId, t.pesoClima] })],
);

export const pecaEstilo = pgTable(
  "peca_estilo",
  {
    pecaId: uuid("peca_id")
      .notNull()
      .references(() => pecas.id, { onDelete: "cascade" }),
    perfilEstiloId: uuid("perfil_estilo_id")
      .notNull()
      .references(() => perfisEstilo.id),
  },
  (t) => [primaryKey({ columns: [t.pecaId, t.perfilEstiloId] })],
);

export const pecaOcasiaoBase = pgTable(
  "peca_ocasiao_base",
  {
    pecaId: uuid("peca_id")
      .notNull()
      .references(() => pecas.id, { onDelete: "cascade" }),
    ocasiao: ocasiaoEnum("ocasiao").notNull(),
  },
  (t) => [primaryKey({ columns: [t.pecaId, t.ocasiao] })],
);

export type Peca = typeof pecas.$inferSelect;
export type NovaPeca = typeof pecas.$inferInsert;
export type PecaImagem = typeof pecaImagens.$inferSelect;
