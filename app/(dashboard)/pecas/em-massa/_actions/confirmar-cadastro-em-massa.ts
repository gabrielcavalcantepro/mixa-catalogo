"use server";

import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { pecaCandidatosIa } from "@/db/schema";
import { storage } from "@/lib/storage";
import { pecaSchema } from "../../_lib/schema";
import { inserirPeca } from "../../_actions/_inserir-peca";

export type ResultadoLinha =
  | { id: string; sucesso: true }
  | { id: string; sucesso: false; erro: string };

type LinhaEnviada = {
  id: string;
  valores: unknown;
  /** Presente quando a linha veio da busca por IA (pecas-ia/), não da planilha. */
  origemCandidatoId?: string;
  /** URL já hospedada (IA) — usada só se não vier arquivo novo em `imagens-<id>`. */
  imagemExistenteUrl?: string | null;
};

/**
 * Chamada direto pelo Client Component (não via `<form action>` — são
 * N peças com N conjuntos de arquivo, não cabe num único form). Recebe
 * `dados` (JSON das linhas prontas pra criar) e, por linha,
 * `imagens-<id>` (arquivos novos daquela peça, se houver). Revalida
 * cada linha com o MESMO `pecaSchema` do form único (nunca confia só
 * na validação do cliente) e tenta cada peça isoladamente — uma falhar
 * não derruba as outras, mesmo espírito do
 * scripts/migrar-imagens-storage.ts.
 *
 * Reaproveitada tanto pelo cadastro em massa via planilha quanto pela
 * busca por IA (`pecas-ia/`) — mesma tela de revisão, mesma ação de
 * confirmar pros 2 fluxos. Quando `origemCandidatoId` vem preenchido,
 * a imagem já está hospedada (subida no momento da busca) — só sobe
 * arquivo novo se o admin trocou manualmente na revisão; e, ao criar a
 * peça com sucesso, marca aquele candidato como `aprovado`.
 */
export async function confirmarCadastroEmMassa(formData: FormData): Promise<ResultadoLinha[]> {
  const dadosBrutos = formData.get("dados");
  if (typeof dadosBrutos !== "string") {
    return [];
  }

  let linhas: LinhaEnviada[];
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

    const arquivosNovos = formData
      .getAll(`imagens-${linha.id}`)
      .filter((v): v is File => v instanceof File && v.size > 0);

    if (arquivosNovos.length === 0 && !linha.imagemExistenteUrl) {
      resultados.push({ id: linha.id, sucesso: false, erro: "Adicione ao menos uma imagem." });
      continue;
    }

    try {
      let urls: string[];
      let pecaId: string | undefined;
      if (arquivosNovos.length > 0) {
        pecaId = randomUUID();
        urls = await Promise.all(
          arquivosNovos.map((arquivo) => storage.salvar(arquivo, `pecas/${pecaId}`)),
        );
      } else {
        urls = [linha.imagemExistenteUrl as string];
      }

      const novaPeca = await inserirPeca(validado.data, urls, pecaId);

      if (linha.origemCandidatoId) {
        await db
          .update(pecaCandidatosIa)
          .set({ status: "aprovado", pecaIdResultante: novaPeca.id, decididoEm: new Date() })
          .where(eq(pecaCandidatosIa.id, linha.origemCandidatoId));
      }

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
    revalidatePath("/pecas-ia");
  }

  return resultados;
}
