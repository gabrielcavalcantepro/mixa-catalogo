"use server";

import { revalidatePath } from "next/cache";
import { pecaSchema } from "../../_lib/schema";
import { inserirPeca } from "../../_actions/_inserir-peca";

export type ResultadoLinha =
  | { id: string; sucesso: true }
  | { id: string; sucesso: false; erro: string };

/**
 * Chamada direto pelo Client Component (não via `<form action>` — são
 * N peças com N conjuntos de arquivo, não cabe num único form). Recebe
 * `dados` (JSON das linhas prontas pra criar) e, por linha,
 * `imagens-<id>` (arquivos daquela peça). Revalida cada linha com o
 * MESMO `pecaSchema` do form único (nunca confia só na validação do
 * cliente) e tenta cada peça isoladamente — uma falhar não derruba as
 * outras, mesmo espírito do scripts/migrar-imagens-storage.ts.
 */
export async function confirmarCadastroEmMassa(formData: FormData): Promise<ResultadoLinha[]> {
  const dadosBrutos = formData.get("dados");
  if (typeof dadosBrutos !== "string") {
    return [];
  }

  let linhas: { id: string; valores: unknown }[];
  try {
    linhas = JSON.parse(dadosBrutos);
  } catch {
    return [];
  }

  const resultados: ResultadoLinha[] = [];

  for (const linha of linhas) {
    const validado = pecaSchema.safeParse(linha.valores);
    if (!validado.success) {
      resultados.push({ id: linha.id, sucesso: false, erro: validado.error.issues[0].message });
      continue;
    }

    const arquivos = formData
      .getAll(`imagens-${linha.id}`)
      .filter((v): v is File => v instanceof File && v.size > 0);
    if (arquivos.length === 0) {
      resultados.push({ id: linha.id, sucesso: false, erro: "Adicione ao menos uma imagem." });
      continue;
    }

    try {
      await inserirPeca(validado.data, arquivos);
      resultados.push({ id: linha.id, sucesso: true });
    } catch (erro) {
      resultados.push({
        id: linha.id,
        sucesso: false,
        erro: erro instanceof Error ? erro.message : "Erro ao criar a peça.",
      });
    }
  }

  if (resultados.some((r) => r.sucesso)) {
    revalidatePath("/pecas");
  }

  return resultados;
}
