import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Slot que a peça ocupa no look. "acessório" da spec original foi
 * dividido em cinto/bolsa/acessorio_outro para permitir combinar vários
 * acessórios num mesmo look (decisão validada com o usuário).
 */
export const slotEnum = pgEnum("slot", [
  "parte_de_cima",
  "parte_de_baixo",
  "peca_unica",
  "calcado",
  "sobreposicao",
  "cinto",
  "bolsa",
  "acessorio_outro",
]);

export const corTipoEnum = pgEnum("cor_tipo", ["neutra", "destaque"]);

export const pesoClimaEnum = pgEnum("peso_clima", [
  "leve",
  "meia_estacao",
  "pesada",
]);

export const ocasiaoEnum = pgEnum("ocasiao", [
  "trabalho",
  "lazer",
  "casa",
  "treino",
  "evento",
]);
