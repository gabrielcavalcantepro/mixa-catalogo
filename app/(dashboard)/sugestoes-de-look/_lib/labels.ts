import { ocasiaoEnum, pesoClimaEnum } from "@/db/schema";

/** Duplicado de pecas/_lib/schema.ts de propósito (fatia autocontida). */
export const PESO_CLIMA_LABELS: Record<(typeof pesoClimaEnum.enumValues)[number], string> = {
  pesada: "Frio",
  meia_estacao: "Meia Estação",
  leve: "Quente",
};

export const OCASIAO_LABELS: Record<(typeof ocasiaoEnum.enumValues)[number], string> = {
  trabalho: "Trabalho",
  lazer: "Lazer",
  casa: "Casa",
  treino: "Treino",
  evento: "Evento",
};
