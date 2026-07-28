import { z } from "zod";
import { corTipoEnum, ocasiaoEnum, pesoClimaEnum, slotEnum } from "@/db/schema";

/**
 * Só esses slots têm clima — cinto, bolsa e acessório-outro não têm
 * "peso de clima" (não faz sentido pra acessório). Usado tanto na
 * validação do servidor quanto pra esconder o campo no form.
 *
 * `sobreposicao` (casaco/blazer/cardigã) entrou em 2026-07-28 — não
 * tinha clima desde a implementação original, o que não fazia sentido
 * de domínio (peça de sobreposição pesada não serve pro calor);
 * decisão do usuário ao notar o comportamento na revisão de candidato
 * da IA. Peça de sobreposição já cadastrada sem clima continua como
 * está até ser editada (sem backfill automático) — só passa a exigir
 * clima em cadastro/edição novos daqui pra frente.
 */
export const SLOTS_COM_CLIMA = [
  "parte_de_cima",
  "parte_de_baixo",
  "peca_unica",
  "calcado",
  "sobreposicao",
] as const;

export const pecaSchema = z
  .object({
    nome: z.string().trim().min(1, "Informe um nome."),
    slot: z.enum(slotEnum.enumValues, { error: "Escolha um slot." }),
    corTipo: z.enum(corTipoEnum.enumValues, { error: "Escolha o tipo de cor." }),
    corValor: z.string().trim().min(1, "Informe a cor."),
    pecaChave: z.boolean(),
    capsulaId: z.uuid({ error: "Escolha uma cápsula." }),
    linkAfiliado: z
      .string()
      .trim()
      .nullish()
      .transform((v) => (v ? v : null)),
    pesoClima: z.array(z.enum(pesoClimaEnum.enumValues)),
    perfilEstiloIds: z.array(z.uuid()).min(1, "Escolha ao menos um perfil de estilo."),
    ocasiaoBase: z
      .array(z.enum(ocasiaoEnum.enumValues))
      .min(1, "Escolha ao menos uma ocasião."),
  })
  .superRefine((val, ctx) => {
    const temClima = SLOTS_COM_CLIMA.includes(val.slot as (typeof SLOTS_COM_CLIMA)[number]);
    if (temClima && val.pesoClima.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["pesoClima"],
        message: "Escolha ao menos um clima.",
      });
    }
    if (!temClima && val.pesoClima.length > 0) {
      ctx.addIssue({
        code: "custom",
        path: ["pesoClima"],
        message: "Esse slot não tem clima.",
      });
    }
  });

export type PecaFormValues = z.infer<typeof pecaSchema>;

/**
 * Forma compartilhada dos campos do form — usada tanto pra pré-preencher
 * a edição (`valoresIniciais`) quanto pra ecoar de volta o que foi
 * submetido quando a action retorna erro (ver PecaActionState). `imagens`
 * só existe no modo edição.
 */
export type PecaValoresFormulario = {
  nome: string;
  slot: string;
  corTipo: string;
  corValor: string;
  pecaChave: boolean;
  capsulaId: string;
  linkAfiliado: string | null;
  pesoClima: string[];
  perfilEstiloIds: string[];
  ocasiaoBase: string[];
  imagens?: { id: string; url: string }[];
};

export type PecaActionState =
  | { erro: string; valores?: PecaValoresFormulario }
  | undefined;

/** Leitura crua do FormData, sem validação — usada tanto pra validar quanto pra ecoar de volta no erro. */
export function extrairValoresPeca(formData: FormData): PecaValoresFormulario {
  return {
    nome: String(formData.get("nome") ?? ""),
    slot: String(formData.get("slot") ?? ""),
    corTipo: String(formData.get("corTipo") ?? ""),
    corValor: String(formData.get("corValor") ?? ""),
    pecaChave: formData.get("pecaChave") === "on",
    capsulaId: String(formData.get("capsulaId") ?? ""),
    linkAfiliado: (formData.get("linkAfiliado") as string) || null,
    pesoClima: formData.getAll("pesoClima").map(String),
    perfilEstiloIds: formData.getAll("perfilEstiloIds").map(String),
    ocasiaoBase: formData.getAll("ocasiaoBase").map(String),
  };
}

export function formDataParaPeca(formData: FormData) {
  return pecaSchema.safeParse(extrairValoresPeca(formData));
}

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

export const COR_TIPO_LABELS: Record<(typeof corTipoEnum.enumValues)[number], string> = {
  neutra: "Neutra",
  destaque: "Destaque",
};

/**
 * Rótulos exibidos ao usuário — os valores internos (leve/meia_estacao/
 * pesada) continuam sendo os mesmos do enum no banco (sem migration),
 * só o texto mostrado mudou: leve→Quente e pesada→Frio, seguindo a
 * lógica térmica (peça leve/fina serve pro calor, pesada/encorpada pro
 * frio) em vez do peso literal do tecido.
 */
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
