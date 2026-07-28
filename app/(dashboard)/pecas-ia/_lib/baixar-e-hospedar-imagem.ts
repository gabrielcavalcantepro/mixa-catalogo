import { storage } from "@/lib/storage";

/**
 * Baixa a imagem encontrada pela busca (URL solta na web) e sobe pro
 * Supabase via a mesma interface `storage` que o resto do catálogo já
 * usa — assim o candidato guarda uma URL hospedada de verdade, não um
 * link externo instável. `null` em qualquer falha (rede, tipo de
 * conteúdo não é imagem) — quem chama trata como rejeição automática.
 */
export async function baixarEHospedarImagem(
  imageUri: string,
  pasta: string,
): Promise<string | null> {
  try {
    const resposta = await fetch(imageUri);
    if (!resposta.ok) return null;

    const contentType = resposta.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) return null;

    const buffer = Buffer.from(await resposta.arrayBuffer());
    const extensao = contentType.split("/")[1]?.split(";")[0] || "jpg";
    const arquivo = new File([new Uint8Array(buffer)], `imagem.${extensao}`, {
      type: contentType,
    });

    return await storage.salvar(arquivo, pasta);
  } catch {
    return null;
  }
}
