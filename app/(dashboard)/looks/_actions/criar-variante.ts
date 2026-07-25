"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { extrairValoresLook, formDataParaLook, type LookActionState } from "../_lib/schema";
import { calcularSlotsTrocados } from "../_lib/calcular-slots-trocados";
import { inserirNovoLook, validarPecasEDerivar } from "./_inserir-look";

export async function criarVariante(
  lookBaseId: string,
  _estadoAnterior: LookActionState,
  formData: FormData,
): Promise<LookActionState> {
  const parsed = formDataParaLook(formData);
  if (!parsed.success) {
    return { erro: parsed.error.issues[0].message, valores: extrairValoresLook(formData) };
  }

  const lookBase = await db.query.looks.findFirst({
    where: (look, { eq }) => eq(look.id, lookBaseId),
    with: { pecas: true },
  });
  if (!lookBase) {
    return { erro: "Look-base não encontrado.", valores: extrairValoresLook(formData) };
  }

  const { pecasPorSlot } = parsed.data;
  const pecasBase = Object.fromEntries(lookBase.pecas.map((lp) => [lp.slot, lp.pecaId]));
  const slotsTrocados = calcularSlotsTrocados(pecasBase, pecasPorSlot);
  if (slotsTrocados.length === 0) {
    return {
      erro: "A variante precisa trocar ao menos uma peça em relação ao look-base.",
      valores: extrairValoresLook(formData),
    };
  }

  const derivado = await validarPecasEDerivar(pecasPorSlot);
  if ("erro" in derivado) {
    return { erro: derivado.erro, valores: extrairValoresLook(formData) };
  }

  const novaVariante = await inserirNovoLook(parsed.data, derivado, {
    varianteDeId: lookBaseId,
    slotsTrocados,
  });

  revalidatePath("/looks");
  redirect(`/looks/${novaVariante.id}`);
}
