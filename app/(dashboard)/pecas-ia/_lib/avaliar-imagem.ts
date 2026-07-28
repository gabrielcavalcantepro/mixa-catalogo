import { obterClienteOpenAI } from "./openai-client";

/**
 * Avaliação de visão (OpenAI): a foto encontrada bate de verdade com a
 * peça pedida? Não bate → quem chama rejeita automaticamente, nunca
 * chega na fila de revisão do admin.
 */
export async function avaliarImagemBateComPeca(
  imagemUrl: string,
  descricaoPeca: string,
): Promise<boolean> {
  const openai = obterClienteOpenAI();

  const resposta = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Essa imagem mostra de verdade uma peça de roupa/acessório do tipo "${descricaoPeca}"? Responda só com uma palavra: "sim" ou "não".`,
          },
          { type: "image_url", image_url: { url: imagemUrl } },
        ],
      },
    ],
    max_tokens: 5,
  });

  const texto = resposta.choices[0]?.message?.content?.trim().toLowerCase() ?? "";
  return texto.startsWith("sim");
}
