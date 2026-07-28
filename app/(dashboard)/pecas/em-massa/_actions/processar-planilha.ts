"use server";

import { randomUUID } from "crypto";
import { db } from "@/db";
import { capsulas, perfisEstilo } from "@/db/schema";
import { pecaSchema } from "../../_lib/schema";
import {
  lerLinhasDaPlanilha,
  mapearLinhaParaPecaFormValues,
  type PecaFormValuesBruto,
} from "../_lib/planilha";

export type LinhaProcessada = {
  id: string;
  valores: PecaFormValuesBruto;
  erro?: string;
};

export type ProcessarPlanilhaState = { erro: string } | { linhas: LinhaProcessada[] } | undefined;

/**
 * Lê o .xlsx enviado e mapeia cada linha pro formato do form de peça,
 * validando com o MESMO `pecaSchema` do form único — nenhuma regra
 * nova aqui. Cápsula/perfil são resolvidos por nome contra o catálogo
 * atual (podem ter mudado desde o download do modelo).
 */
export async function processarPlanilha(
  _estadoAnterior: ProcessarPlanilhaState,
  formData: FormData,
): Promise<ProcessarPlanilhaState> {
  const arquivo = formData.get("arquivo");
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { erro: "Selecione um arquivo .xlsx." };
  }

  const buffer = Buffer.from(await arquivo.arrayBuffer());
  const linhasBrutas = await lerLinhasDaPlanilha(buffer);
  if (linhasBrutas.length === 0) {
    return {
      erro:
        "Nenhuma peça encontrada na planilha (confira se a linha 1 é o cabeçalho e há ao menos 1 linha preenchida).",
    };
  }

  const [listaCapsulas, listaPerfis] = await Promise.all([
    db.select({ id: capsulas.id, nome: capsulas.nome }).from(capsulas),
    db.select({ id: perfisEstilo.id, nome: perfisEstilo.nome }).from(perfisEstilo),
  ]);
  const contexto = {
    capsulaIdPorNome: new Map(listaCapsulas.map((c) => [c.nome, c.id])),
    perfilIdPorNome: new Map(listaPerfis.map((p) => [p.nome, p.id])),
    nomesPerfis: listaPerfis.map((p) => p.nome),
  };

  const linhas: LinhaProcessada[] = linhasBrutas.map((linha) => {
    const mapeada = mapearLinhaParaPecaFormValues(linha, contexto);
    if (mapeada.erro) {
      return { id: randomUUID(), valores: mapeada.valores, erro: mapeada.erro };
    }
    const validado = pecaSchema.safeParse(mapeada.valores);
    return {
      id: randomUUID(),
      valores: mapeada.valores,
      erro: validado.success ? undefined : validado.error.issues[0].message,
    };
  });

  return { linhas };
}
