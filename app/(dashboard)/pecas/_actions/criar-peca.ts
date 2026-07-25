"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { pecaEstilo, pecaImagens, pecaOcasiaoBase, pecaPesoClima, pecas } from "@/db/schema";
import { storage } from "@/lib/storage";
import { extrairValoresPeca, formDataParaPeca, type PecaActionState } from "../_lib/schema";

export async function criarPeca(
  _estadoAnterior: PecaActionState,
  formData: FormData,
): Promise<PecaActionState> {
  const parsed = formDataParaPeca(formData);
  if (!parsed.success) {
    return { erro: parsed.error.issues[0].message, valores: extrairValoresPeca(formData) };
  }

  const arquivos = formData
    .getAll("imagens")
    .filter((v): v is File => v instanceof File && v.size > 0);
  if (arquivos.length === 0) {
    return {
      erro: "Adicione ao menos uma imagem.",
      valores: extrairValoresPeca(formData),
    };
  }

  const { pesoClima, perfilEstiloIds, ocasiaoBase, ...dadosPeca } = parsed.data;

  const novaPeca = await db.transaction(async (tx) => {
    const [peca] = await tx.insert(pecas).values(dadosPeca).returning();
    await Promise.all([
      tx
        .insert(pecaPesoClima)
        .values(pesoClima.map((p) => ({ pecaId: peca.id, pesoClima: p }))),
      tx
        .insert(pecaEstilo)
        .values(perfilEstiloIds.map((id) => ({ pecaId: peca.id, perfilEstiloId: id }))),
      tx
        .insert(pecaOcasiaoBase)
        .values(ocasiaoBase.map((o) => ({ pecaId: peca.id, ocasiao: o }))),
    ]);
    return peca;
  });

  const urls = await Promise.all(
    arquivos.map((arquivo) => storage.salvar(arquivo, `pecas/${novaPeca.id}`)),
  );
  await db
    .insert(pecaImagens)
    .values(urls.map((url, ordem) => ({ pecaId: novaPeca.id, url, ordem, isCapa: ordem === 0 })));

  revalidatePath("/pecas");
  redirect("/pecas");
}
