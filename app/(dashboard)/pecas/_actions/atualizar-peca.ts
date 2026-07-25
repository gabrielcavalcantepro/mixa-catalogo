"use server";

import { eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { pecaEstilo, pecaImagens, pecaOcasiaoBase, pecaPesoClima, pecas } from "@/db/schema";
import { storage } from "@/lib/storage";
import { extrairValoresPeca, formDataParaPeca, type PecaActionState } from "../_lib/schema";

export async function atualizarPeca(
  id: string,
  _estadoAnterior: PecaActionState,
  formData: FormData,
): Promise<PecaActionState> {
  const parsed = formDataParaPeca(formData);
  if (!parsed.success) {
    return { erro: parsed.error.issues[0].message, valores: extrairValoresPeca(formData) };
  }

  const imagensAtuais = await db
    .select()
    .from(pecaImagens)
    .where(eq(pecaImagens.pecaId, id))
    .orderBy(pecaImagens.ordem);

  const removidasIds = formData.getAll("imagensRemovidasIds").map(String);
  const restantes = imagensAtuais.filter((img) => !removidasIds.includes(img.id));

  const novosArquivos = formData
    .getAll("imagens")
    .filter((v): v is File => v instanceof File && v.size > 0);

  if (restantes.length + novosArquivos.length === 0) {
    return {
      erro: "A peça precisa ter ao menos uma imagem.",
      valores: extrairValoresPeca(formData),
    };
  }

  const { pesoClima, perfilEstiloIds, ocasiaoBase, ...dadosPeca } = parsed.data;

  await db.transaction(async (tx) => {
    await tx
      .update(pecas)
      .set({ ...dadosPeca, atualizadoEm: new Date() })
      .where(eq(pecas.id, id));

    await tx.delete(pecaPesoClima).where(eq(pecaPesoClima.pecaId, id));
    await tx.delete(pecaEstilo).where(eq(pecaEstilo.pecaId, id));
    await tx.delete(pecaOcasiaoBase).where(eq(pecaOcasiaoBase.pecaId, id));

    await Promise.all([
      tx.insert(pecaPesoClima).values(pesoClima.map((p) => ({ pecaId: id, pesoClima: p }))),
      tx
        .insert(pecaEstilo)
        .values(perfilEstiloIds.map((pid) => ({ pecaId: id, perfilEstiloId: pid }))),
      tx
        .insert(pecaOcasiaoBase)
        .values(ocasiaoBase.map((o) => ({ pecaId: id, ocasiao: o }))),
    ]);

    if (removidasIds.length > 0) {
      await tx.delete(pecaImagens).where(inArray(pecaImagens.id, removidasIds));
    }
  });

  await Promise.all(
    removidasIds.map((rid) => {
      const img = imagensAtuais.find((i) => i.id === rid);
      return img ? storage.remover(img.url) : Promise.resolve();
    }),
  );

  const urlsNovas = await Promise.all(
    novosArquivos.map((arquivo) => storage.salvar(arquivo, `pecas/${id}`)),
  );

  let proximaOrdem = restantes.length > 0 ? Math.max(...restantes.map((i) => i.ordem)) + 1 : 0;
  if (urlsNovas.length > 0) {
    await db
      .insert(pecaImagens)
      .values(urlsNovas.map((url) => ({ pecaId: id, url, ordem: proximaOrdem++, isCapa: false })));
  }

  const capaAindaExiste = restantes.some((img) => img.isCapa);
  if (!capaAindaExiste) {
    const [primeira] = await db
      .select()
      .from(pecaImagens)
      .where(eq(pecaImagens.pecaId, id))
      .orderBy(pecaImagens.ordem)
      .limit(1);
    if (primeira) {
      await db.update(pecaImagens).set({ isCapa: true }).where(eq(pecaImagens.id, primeira.id));
    }
  }

  revalidatePath("/pecas");
  redirect("/pecas");
}
