"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { pecaCandidatosIa } from "@/db/schema";
import { excluirPeca } from "../../pecas/_actions/excluir-peca";

/**
 * "Desfazer" uma aprovação: reaproveita `excluirPeca` (já cuida de
 * apagar a imagem no Supabase e de bloquear se a peça estiver em uso
 * num look) e, se der certo, marca o candidato como `desfeito` — nunca
 * volta a `pendente` (aprovado não tem volta, mas pode ser desfeito).
 */
export async function desfazerAprovacaoAction(candidatoId: string): Promise<{ erro?: string }> {
  const candidato = await db.query.pecaCandidatosIa.findFirst({
    where: eq(pecaCandidatosIa.id, candidatoId),
  });
  if (!candidato?.pecaIdResultante) {
    return { erro: "Candidato não encontrado ou sem peça associada." };
  }

  const resultado = await excluirPeca(candidato.pecaIdResultante);
  if (resultado?.erro) {
    return { erro: resultado.erro };
  }

  await db
    .update(pecaCandidatosIa)
    .set({ status: "desfeito", decididoEm: new Date() })
    .where(eq(pecaCandidatosIa.id, candidatoId));

  revalidatePath("/pecas-ia");
  revalidatePath("/pecas");
  return {};
}
