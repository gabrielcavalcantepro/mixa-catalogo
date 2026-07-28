import { z } from "zod";
import { corTipoEnum } from "@/db/schema";
import { obterClienteOpenAI } from "./openai-client";

export type AvaliacaoImagem = {
  bate: boolean;
  corValor: string | null;
  corTipo: (typeof corTipoEnum.enumValues)[number] | null;
};

const avaliacaoSchema = z.object({
  bate: z.boolean(),
  corValor: z.string().trim().min(1).nullish(),
  corTipo: z.enum(corTipoEnum.enumValues).nullish(),
});

/**
 * Avaliação de visão (OpenAI): a foto encontrada bate de verdade com a
 * peça pedida? Também extrai a cor real observada na imagem — a cor
 * do item (`corTipo`/`corValor`) é decidida inteiramente no passo 1
 * (geração da lista), antes de qualquer foto existir, e nunca era
 * conferida contra a imagem de verdade; quem chama substitui os campos
 * de cor do item pelo que a visão realmente vê aqui, antes de gravar o
 * candidato (ver CLAUDE.md). Não bate → quem chama rejeita
 * automaticamente, nunca chega na fila de revisão do admin.
 */
export async function avaliarImagemBateComPeca(
  imagemUrl: string,
  descricaoPeca: string,
): Promise<AvaliacaoImagem> {
  const openai = obterClienteOpenAI();

  const resposta = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Essa imagem mostra de verdade uma peça de roupa/acessório do tipo "${descricaoPeca}"? Responda só com um objeto JSON nesse formato exato, sem markdown, sem texto antes ou depois:
{"bate": true ou false, "corValor": "nome da cor real da peça na foto, em português (ex: preto, azul marinho, vermelho)", "corTipo": "neutra ou destaque, de acordo com a cor de verdade que você vê na foto"}

Mesmo se "bate" for false, ainda descreva a cor que você vê na imagem.`,
          },
          { type: "image_url", image_url: { url: imagemUrl } },
        ],
      },
    ],
    max_tokens: 120,
  });

  const texto = resposta.choices[0]?.message?.content ?? "";
  const correspondencia = texto.match(/\{[\s\S]*\}/);
  if (!correspondencia) return { bate: false, corValor: null, corTipo: null };

  try {
    const bruto: unknown = JSON.parse(correspondencia[0]);
    const resultado = avaliacaoSchema.safeParse(bruto);
    if (!resultado.success) return { bate: false, corValor: null, corTipo: null };

    return {
      bate: resultado.data.bate,
      corValor: resultado.data.corValor ?? null,
      corTipo: resultado.data.corTipo ?? null,
    };
  } catch {
    return { bate: false, corValor: null, corTipo: null };
  }
}
