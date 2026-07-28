import { z } from "zod";
import { corTipoEnum, ocasiaoEnum, pesoClimaEnum, slotEnum } from "@/db/schema";
import { obterClienteOpenAI } from "./openai-client";

const itemGeradoSchema = z.object({
  nome: z.string().trim().min(1),
  slot: z.enum(slotEnum.enumValues),
  corTipo: z.enum(corTipoEnum.enumValues),
  corValor: z.string().trim().min(1),
  pecaChave: z.boolean(),
  pesoClima: z.array(z.enum(pesoClimaEnum.enumValues)),
  ocasiaoBase: z.array(z.enum(ocasiaoEnum.enumValues)).min(1),
});

export type ItemGerado = z.infer<typeof itemGeradoSchema>;

const listaGeradaSchema = z.array(itemGeradoSchema).min(1).max(15);

const SLOTS_SEM_CLIMA = ["cinto", "bolsa", "acessorio_outro"];

/**
 * Gera até 10 peças pro perfil de estilo indicado — 1 chamada só à
 * OpenAI, com a ferramenta de busca web (`web_search_options`)
 * ativada nos modelos `-search-preview`. O prompt separa explicitamente
 * 7 peças "de conhecimento" (sem pesquisar) de 3 peças "de tendência
 * atual" (baseadas na busca) — essa separação é instrução de prompt,
 * não 2 chamadas de API, porque o pedido era "1 busca só". Observações
 * recentes do curador (se houver) entram como contexto.
 *
 * Antes usava Gemini (grounding com Google Search) — trocado por
 * exigir carregar saldo de faturamento na conta Google pra liberar a
 * ferramenta de busca, mesmo dentro do nível gratuito (ver CLAUDE.md).
 *
 * Saída estruturada (`response_format` com JSON Schema) não é usada
 * aqui de propósito: modelos `-search-preview` não combinam saída
 * estruturada com a busca web na mesma chamada — por isso o formato é
 * pedido por instrução no prompt, e a resposta é validada com Zod
 * antes de seguir (saída de LLM não é confiável por padrão).
 */
export async function gerarListaDePecas(opcoes: {
  nomeEstilo: string;
  observacoesRecentes: string[];
}): Promise<ItemGerado[]> {
  const openai = obterClienteOpenAI();

  const blocoObservacoes =
    opcoes.observacoesRecentes.length > 0
      ? `Observações do curador sobre buscas anteriores (leve em conta ao escolher as peças):\n${opcoes.observacoesRecentes.map((o) => `- ${o}`).join("\n")}\n\n`
      : "";

  const prompt = `Você é um curador de moda feminina. Gere uma lista de 10 peças de roupa/acessório pro perfil de estilo "${opcoes.nomeEstilo}".

${blocoObservacoes}Regras:
- As primeiras 7 peças vêm do seu conhecimento geral de moda clássica e atemporal — não pesquise nada pra elas.
- As últimas 3 peças devem ser baseadas numa busca atual por "tendências moda feminina ${opcoes.nomeEstilo} 2026" — use a ferramenta de busca disponível pra isso antes de decidir essas 3.
- Cada peça precisa ter exatamente estes campos:
  - "nome": nome curto e descritivo (string)
  - "slot": um destes valores exatos: ${slotEnum.enumValues.join(", ")}
  - "corTipo": "neutra" ou "destaque"
  - "corValor": nome da cor em português (string)
  - "pecaChave": true ou false — é uma peça coringa versátil?
  - "pesoClima": array com 0 ou mais destes valores: leve, meia_estacao, pesada — deixe vazio SE E SÓ SE o slot for ${SLOTS_SEM_CLIMA.join(", ")} (esses não têm clima)
  - "ocasiaoBase": array com 1 ou mais destes valores: trabalho, lazer, casa, treino, evento

Responda só com um array JSON de 10 objetos nesse formato exato, sem markdown, sem texto antes ou depois.`;

  const resposta = await openai.chat.completions.create({
    model: "gpt-4o-mini-search-preview",
    web_search_options: {},
    messages: [{ role: "user", content: prompt }],
  });

  const texto = resposta.choices[0]?.message?.content ?? "";
  const correspondencia = texto.match(/\[[\s\S]*\]/);
  if (!correspondencia) {
    throw new Error("OpenAI não devolveu um array JSON reconhecível na geração da lista.");
  }

  const bruto: unknown = JSON.parse(correspondencia[0]);
  return listaGeradaSchema.parse(bruto);
}
