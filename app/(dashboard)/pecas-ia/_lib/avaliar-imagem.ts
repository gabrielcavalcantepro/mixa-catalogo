import { z } from "zod";
import { corTipoEnum } from "@/db/schema";
import { obterClienteOpenAI } from "./openai-client";

export type PerfilParaJulgamento = { id: string; nome: string; descricao: string | null };

export type AvaliacaoImagem = {
  bate: boolean;
  fundoNeutro: boolean;
  corValor: string | null;
  corTipo: (typeof corTipoEnum.enumValues)[number] | null;
  perfisEstiloIds: string[];
};

const avaliacaoSchema = z.object({
  bate: z.boolean(),
  fundoNeutro: z.boolean(),
  corValor: z.string().trim().min(1).nullish(),
  corTipo: z.enum(corTipoEnum.enumValues).nullish(),
  perfisEstilo: z.array(z.string()).nullish(),
});

const AVALIACAO_PADRAO_SEM_MATCH: AvaliacaoImagem = {
  bate: false,
  fundoNeutro: false,
  corValor: null,
  corTipo: null,
  perfisEstiloIds: [],
};

/**
 * Avaliação de visão (OpenAI): a foto encontrada bate de verdade com a
 * peça pedida, e tem fundo neutro (padrão de loja — peça isolada ou
 * pessoa vestindo a peça, mas sem ambiente/fundo bagunçado)? Também
 * extrai a cor real observada na imagem — a cor do item
 * (`corTipo`/`corValor`) é decidida inteiramente no passo 1 (geração da
 * lista), antes de qualquer foto existir, e nunca era conferida contra
 * a imagem de verdade; quem chama substitui os campos de cor do item
 * pelo que a visão realmente vê aqui, antes de gravar o candidato (ver
 * CLAUDE.md). `bate: false` ou `fundoNeutro: false` → quem chama
 * rejeita automaticamente, nunca chega na fila de revisão do admin.
 *
 * Também julga, entre `perfisDisponiveis` (todos os perfis de estilo
 * cadastrados, não só o escolhido na geração), quais combinam com a
 * peça na foto — uma peça pode encaixar em mais de um perfil (2026-07-28,
 * observação do usuário revisando candidato). O modelo devolve nomes
 * (mais robusto a erro de digitação do que pedir id direto); a
 * resolução nome→id acontece aqui, contra a lista recebida — nome que
 * não bate com nenhum perfil de verdade é ignorado, nunca inventa uuid.
 * Quem chama sempre garante que o perfil originalmente pedido também
 * entra na lista final, além do que vier daqui.
 */
export async function avaliarImagemBateComPeca(
  imagemUrl: string,
  descricaoPeca: string,
  perfisDisponiveis: PerfilParaJulgamento[],
): Promise<AvaliacaoImagem> {
  const openai = obterClienteOpenAI();

  const listaPerfis = perfisDisponiveis
    .map((p) => `- ${p.nome}${p.descricao ? `: ${p.descricao}` : ""}`)
    .join("\n");

  const resposta = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Essa imagem mostra de verdade uma peça de roupa/acessório do tipo "${descricaoPeca}"? E o fundo da foto é neutro, padrão de e-commerce de moda (fundo liso/sem bagunça — pode ser só a peça isolada, ou uma pessoa vestindo a peça, mas sempre com fundo neutro, nunca um ambiente com muita coisa visível ao fundo)?

Além disso, dentre estes perfis de estilo, quais combinam de verdade com a peça na foto (uma peça pode combinar com mais de um perfil ao mesmo tempo, isso é normal, julgue cada um de forma independente):
${listaPerfis}

Responda só com um objeto JSON nesse formato exato, sem markdown, sem texto antes ou depois:
{"bate": true ou false, "fundoNeutro": true ou false, "corValor": "nome da cor real da peça na foto, em português (ex: preto, azul marinho, vermelho)", "corTipo": "neutra ou destaque, de acordo com a cor de verdade que você vê na foto", "perfisEstilo": ["nome exato de cada perfil da lista acima que combina com a peça, pode ser 1 ou mais"]}

Mesmo se "bate" ou "fundoNeutro" for false, ainda descreva a cor que você vê na imagem.`,
          },
          { type: "image_url", image_url: { url: imagemUrl } },
        ],
      },
    ],
    max_tokens: 250,
  });

  const texto = resposta.choices[0]?.message?.content ?? "";
  const correspondencia = texto.match(/\{[\s\S]*\}/);
  if (!correspondencia) return AVALIACAO_PADRAO_SEM_MATCH;

  try {
    const bruto: unknown = JSON.parse(correspondencia[0]);
    const resultado = avaliacaoSchema.safeParse(bruto);
    if (!resultado.success) return AVALIACAO_PADRAO_SEM_MATCH;

    const nomesRecebidos = new Set(
      (resultado.data.perfisEstilo ?? []).map((n) => n.trim().toLowerCase()),
    );
    const perfisEstiloIds = perfisDisponiveis
      .filter((p) => nomesRecebidos.has(p.nome.trim().toLowerCase()))
      .map((p) => p.id);

    return {
      bate: resultado.data.bate,
      fundoNeutro: resultado.data.fundoNeutro,
      corValor: resultado.data.corValor ?? null,
      corTipo: resultado.data.corTipo ?? null,
      perfisEstiloIds,
    };
  } catch {
    return AVALIACAO_PADRAO_SEM_MATCH;
  }
}
