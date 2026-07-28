"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { buscaIaObservacoes } from "@/db/schema";

export type SalvarObservacaoState = { erro: string } | undefined;

export async function salvarObservacaoAction(
  _estadoAnterior: SalvarObservacaoState,
  formData: FormData,
): Promise<SalvarObservacaoState> {
  const texto = String(formData.get("texto") ?? "").trim();
  if (!texto) {
    return { erro: "Escreva uma observação antes de salvar." };
  }

  await db.insert(buscaIaObservacoes).values({ texto });
  revalidatePath("/pecas-ia");
  return undefined;
}
