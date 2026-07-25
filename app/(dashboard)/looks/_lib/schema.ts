import { z } from "zod";
import { ocasiaoEnum, pesoClimaEnum, slotEnum } from "@/db/schema";

export const lookSchema = z.object({
  nome: z
    .string()
    .trim()
    .nullish()
    .transform((v) => (v ? v : null)),
  ocasiao: z.array(z.enum(ocasiaoEnum.enumValues)).min(1, "Escolha ao menos uma ocasião."),
  perfilEstiloIds: z.array(z.uuid()).min(1, "Escolha ao menos um perfil de estilo."),
  pecasPorSlot: z
    .record(z.string(), z.uuid())
    .refine((obj) => Object.keys(obj).length > 0, {
      error: "Escolha ao menos uma peça.",
    }),
});

/**
 * Forma compartilhada dos campos do form — usada tanto pra pré-preencher
 * edição/variante (`valoresIniciais`) quanto pra ecoar de volta o que foi
 * submetido quando a action retorna erro (ver LookActionState).
 */
export type LookValoresFormulario = {
  nome: string | null;
  ocasiao: string[];
  perfilEstiloIds: string[];
  pecasPorSlot: Record<string, string>;
  /**
   * Só usado no fluxo de aprovar candidato (`camposExtras` do
   * `LookForm`) — "" quando nenhum look-base foi escolhido. Fica no tipo
   * compartilhado só pra participar do mesmo eco de valores no erro
   * (ver aprovar-candidato.ts); criar/editar look ignoram este campo.
   */
  varianteDeId?: string;
};

export type LookActionState =
  | { erro: string; valores?: LookValoresFormulario }
  | undefined;

/** Leitura crua do FormData, sem validação — usada tanto pra validar quanto pra ecoar de volta no erro. */
export function extrairValoresLook(formData: FormData): LookValoresFormulario {
  const pecasPorSlot: Record<string, string> = {};
  for (const slot of slotEnum.enumValues) {
    const valor = formData.get(`peca_${slot}`);
    if (typeof valor === "string" && valor) {
      pecasPorSlot[slot] = valor;
    }
  }

  return {
    nome: (formData.get("nome") as string) || null,
    ocasiao: formData.getAll("ocasiao").map(String),
    perfilEstiloIds: formData.getAll("perfilEstiloIds").map(String),
    pecasPorSlot,
    varianteDeId: (formData.get("varianteDeId") as string) || "",
  };
}

export function formDataParaLook(formData: FormData) {
  return lookSchema.safeParse(extrairValoresLook(formData));
}

/**
 * Rótulos e ordem de exibição duplicados de pecas/_lib/schema.ts de
 * propósito: cada fatia fica autocontida, sem importar código interno de
 * outra fatia (ver plano de arquitetura).
 */
export const SLOT_LABELS: Record<(typeof slotEnum.enumValues)[number], string> = {
  parte_de_cima: "Parte de cima",
  parte_de_baixo: "Parte de baixo",
  peca_unica: "Peça única (vestido/macacão)",
  sobreposicao: "Sobreposição (casaco/blazer/cardigã)",
  calcado: "Calçado",
  cinto: "Cinto",
  bolsa: "Bolsa",
  acessorio_outro: "Acessório (outro)",
};

/** Ordem de exibição (visual, tipo "vestir de cima pra baixo") — independente da ordem do enum no banco. */
export const SLOTS_EM_ORDEM = Object.keys(SLOT_LABELS) as (typeof slotEnum.enumValues)[number][];

export const OCASIAO_LABELS: Record<(typeof ocasiaoEnum.enumValues)[number], string> = {
  trabalho: "Trabalho",
  lazer: "Lazer",
  casa: "Casa",
  treino: "Treino",
  evento: "Evento",
};

/** Duplicado de pecas/_lib/schema.ts de propósito (ver nota acima). */
export const PESO_CLIMA_LABELS: Record<(typeof pesoClimaEnum.enumValues)[number], string> = {
  pesada: "Frio",
  meia_estacao: "Meia Estação",
  leve: "Quente",
};
