import {
  AnyPgColumn,
  boolean,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { ocasiaoEnum, pesoClimaEnum, slotEnum } from "./enums";
import { capsulas } from "./capsula";
import { perfisEstilo } from "./perfil-estilo";
import { pecas } from "./peca";

/**
 * Combinação curada de peças, montada manualmente por um gestor.
 * `capsulaId` é derivada (peça mais recente entre as do look) e
 * recalculada a cada save — ver looks/_lib/derivar-capsula.ts. `climaMisto`
 * idem, mas pro clima (looks/_lib/derivar-clima.ts): true quando as peças
 * do look não têm nenhum clima em comum — não bloqueia a criação, só
 * sinaliza pro curador (ver look_clima abaixo).
 */
export const looks = pgTable("look", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome"),
  capsulaId: uuid("capsula_id")
    .notNull()
    .references(() => capsulas.id),
  climaMisto: boolean("clima_misto").notNull().default(false),
  varianteDeId: uuid("variante_de_id").references((): AnyPgColumn => looks.id),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Uma peça por slot: chave primária composta garante isso no banco. */
export const lookPecas = pgTable(
  "look_peca",
  {
    lookId: uuid("look_id")
      .notNull()
      .references(() => looks.id, { onDelete: "cascade" }),
    slot: slotEnum("slot").notNull(),
    pecaId: uuid("peca_id")
      .notNull()
      .references(() => pecas.id),
  },
  (t) => [primaryKey({ columns: [t.lookId, t.slot] })],
);

export const lookOcasioes = pgTable(
  "look_ocasiao",
  {
    lookId: uuid("look_id")
      .notNull()
      .references(() => looks.id, { onDelete: "cascade" }),
    ocasiao: ocasiaoEnum("ocasiao").notNull(),
  },
  (t) => [primaryKey({ columns: [t.lookId, t.ocasiao] })],
);

export const lookPerfisEstilo = pgTable(
  "look_perfil_estilo",
  {
    lookId: uuid("look_id")
      .notNull()
      .references(() => looks.id, { onDelete: "cascade" }),
    perfilEstiloId: uuid("perfil_estilo_id")
      .notNull()
      .references(() => perfisEstilo.id),
  },
  (t) => [primaryKey({ columns: [t.lookId, t.perfilEstiloId] })],
);

/**
 * Só populada quando `varianteDeId` não é nulo. Lista de slots (não um
 * único valor) — uma variante pode trocar cinto + sapato de uma vez
 * (decisão validada com o usuário, ver plano).
 */
export const lookSlotsTrocados = pgTable(
  "look_slot_trocado",
  {
    lookId: uuid("look_id")
      .notNull()
      .references(() => looks.id, { onDelete: "cascade" }),
    slot: slotEnum("slot").notNull(),
  },
  (t) => [primaryKey({ columns: [t.lookId, t.slot] })],
);

/**
 * Clima derivado do look — interseção dos climas das peças que têm clima
 * definido (ignora cinto/bolsa/acessório-outro). Vazia quando `climaMisto`
 * é true (peças com clima definido mas sem nenhum em comum) ou quando o
 * look não tem nenhuma peça de slot com clima.
 */
export const lookClimas = pgTable(
  "look_clima",
  {
    lookId: uuid("look_id")
      .notNull()
      .references(() => looks.id, { onDelete: "cascade" }),
    pesoClima: pesoClimaEnum("peso_clima").notNull(),
  },
  (t) => [primaryKey({ columns: [t.lookId, t.pesoClima] })],
);

export type Look = typeof looks.$inferSelect;
export type NovoLook = typeof looks.$inferInsert;
