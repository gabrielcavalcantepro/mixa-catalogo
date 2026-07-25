"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { extrairValoresLook, formDataParaLook, type LookActionState } from "../_lib/schema";
import { inserirNovoLook, validarPecasEDerivar } from "./_inserir-look";

export async function criarLook(
  _estadoAnterior: LookActionState,
  formData: FormData,
): Promise<LookActionState> {
  const parsed = formDataParaLook(formData);
  if (!parsed.success) {
    return { erro: parsed.error.issues[0].message, valores: extrairValoresLook(formData) };
  }

  const derivado = await validarPecasEDerivar(parsed.data.pecasPorSlot);
  if ("erro" in derivado) {
    return { erro: derivado.erro, valores: extrairValoresLook(formData) };
  }

  const novoLook = await inserirNovoLook(parsed.data, derivado);

  revalidatePath("/looks");
  redirect(`/looks/${novoLook.id}`);
}
