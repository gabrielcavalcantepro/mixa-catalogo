import { obterClienteOpenAI } from "./openai-client";

export type ImagemEncontrada = { imageUri: string; sourceUri: string | null };

const LIMITE_CITACOES_TENTADAS = 5;
const TIMEOUT_FETCH_PAGINA_MS = 8000;

/**
 * Busca uma foto real de produto pra peça descrita — em 2 passos, não
 * 1: (1) busca web da OpenAI (`web_search_options`) pra achar página(s)
 * reais de produto, lendo a citação real que a própria API anexa em
 * `annotations[].url_citation.url` (não pedindo pro modelo apontar URL
 * nenhuma); (2) visita a página de verdade e extrai a imagem principal
 * de lá (`og:image`, com fallback pra 1ª `<img>` que não pareça
 * logo/ícone) — sem perguntar pra IA "qual é a URL da imagem", só lendo
 * o que já está marcado na própria página.
 *
 * Isso substitui uma 1ª tentativa (pedir em 1 chamada só um JSON com
 * `imageUrl` direto) que se mostrou inviável: forçar o modelo a devolver
 * JSON estrito quebra o mecanismo de citação (annotations vêm vazias) e
 * ele passa a **inventar** uma URL de imagem plausível em vez de citar
 * uma de verdade — confirmado ao vivo (pediu uma foto de "Blazer
 * Estruturado, cor preto" e devolveu uma URL no formato exato de CDN da
 * Zara que na verdade dá 404). Já em prompt de texto livre (sem forçar
 * JSON), as citações vêm reais e majoritariamente navegáveis (checado
 * manualmente: a maioria das páginas citadas responde 200 e é a página
 * de produto de verdade).
 *
 * `null` quando nenhuma citação rende imagem extraível — quem chama
 * trata isso como rejeição automática, não erro. O check de
 * `content-type` em `baixarEHospedarImagem` continua como a validação
 * final de "isso é imagem de verdade" — esta função só decide de onde
 * vem a URL candidata.
 *
 * Antes usava Gemini (grounding com busca de imagem dedicada,
 * `searchTypes.imageSearch`) — trocado por exigir carregar saldo de
 * faturamento na conta Google pra liberar a ferramenta de busca, mesmo
 * dentro do nível gratuito (ver CLAUDE.md).
 */
export async function buscarImagemDaPeca(descricao: string): Promise<ImagemEncontrada | null> {
  const openai = obterClienteOpenAI();

  const resposta = await openai.chat.completions.create({
    model: "gpt-4o-mini-search-preview",
    web_search_options: {},
    messages: [
      {
        role: "user",
        content: `Busque na web uma página real de e-commerce/varejo de moda que venda um produto do tipo "${descricao}". Responda citando a(s) página(s) de produto que encontrar.`,
      },
    ],
  });

  const citacoes = resposta.choices[0]?.message?.annotations ?? [];

  for (const citacao of citacoes.slice(0, LIMITE_CITACOES_TENTADAS)) {
    const paginaUrl = citacao.url_citation?.url;
    if (!paginaUrl) continue;

    const imagemUrl = await extrairImagemPrincipalDaPagina(paginaUrl);
    if (imagemUrl) return { imageUri: imagemUrl, sourceUri: paginaUrl };
  }

  return null;
}

async function extrairImagemPrincipalDaPagina(paginaUrl: string): Promise<string | null> {
  try {
    const resposta = await fetch(paginaUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(TIMEOUT_FETCH_PAGINA_MS),
    });
    if (!resposta.ok) return null;

    const html = await resposta.text();

    const ogImage =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (ogImage?.[1]) {
      const absoluta = resolverUrlAbsoluta(ogImage[1], paginaUrl);
      if (absoluta) return absoluta;
    }

    const imagens = html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi);
    for (const imagem of imagens) {
      const src = imagem[1];
      if (!src || /logo|icon|sprite|placeholder|pixel\.gif|data:/i.test(src)) continue;
      const absoluta = resolverUrlAbsoluta(src, paginaUrl);
      if (absoluta) return absoluta;
    }

    return null;
  } catch {
    return null;
  }
}

function resolverUrlAbsoluta(url: string, base: string): string | null {
  try {
    return new URL(url, base).toString();
  } catch {
    return null;
  }
}
