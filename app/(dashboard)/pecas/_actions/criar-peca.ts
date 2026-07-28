"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { extrairValoresPeca, formDataParaPeca, type PecaActionState } from "../_lib/schema";
import { inserirPeca } from "./_inserir-peca";

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

  await inserirPeca(parsed.data, arquivos);

  revalidatePath("/pecas");
  redirect("/pecas");
}
