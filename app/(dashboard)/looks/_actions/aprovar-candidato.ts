"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { lookCandidatos } from "@/db/schema";
import { extrairValoresLook, formDataParaLook, type LookActionState } from "../_lib/schema";
import { calcularSlotsTrocados } from "../_lib/calcular-slots-trocados";
import { inserirNovoLook, validarPecasEDerivar } from "./_inserir-look";

/**
 * "Aprovar um candidato" é, na essência, criar um look — reaproveita o
 * mesmo helper de inserção de criar-look.ts/criar-variante.ts. Ao final,
 * marca o candidato como `aprovado` (não apaga — mantém histórico) pra
 * essa combinação nunca mais reaparecer nas filas de sugestão. O Look
 * criado já entra sozinho no cálculo de assinaturas existentes da
 * próxima geração, então manter a linha do candidato não arrisca
 * duplicar nada.
 *
 * Se o curador escolher um look-base (`varianteDeId`), o candidato vira
 * uma variante em vez de um look solto — o slot trocado é calculado
 * automaticamente com a mesma função que o fluxo manual de criar
 * variante já usa (`calcularSlotsTrocados`), sem duplicar a lógica.
 */
export async function aprovarCandidato(
  candidatoId: string,
  _estadoAnterior: LookActionState,
  formData: FormData,
): Promise<LookActionState> {
  const parsed = formDataParaLook(formData);
  if (!parsed.success) {
    return { erro: parsed.error.issues[0].message, valores: extrairValoresLook(formData) };
  }

  const varianteDeId = (formData.get("varianteDeId") as string) || undefined;

  let slotsTrocados: string[] | undefined;
  if (varianteDeId) {
    const lookBase = await db.query.looks.findFirst({
      where: (look, { eq }) => eq(look.id, varianteDeId),
      with: { pecas: true },
    });
    if (!lookBase) {
      return { erro: "Look-base não encontrado.", valores: extrairValoresLook(formData) };
    }

    const pecasBase = Object.fromEntries(lookBase.pecas.map((lp) => [lp.slot, lp.pecaId]));
    slotsTrocados = calcularSlotsTrocados(pecasBase, parsed.data.pecasPorSlot);
    if (slotsTrocados.length === 0) {
      return {
        erro:
          "Escolhendo um look-base, a variante precisa trocar ao menos uma peça em relação a ele.",
        valores: extrairValoresLook(formData),
      };
    }
  }

  const derivado = await validarPecasEDerivar(parsed.data.pecasPorSlot);
  if ("erro" in derivado) {
    return { erro: derivado.erro, valores: extrairValoresLook(formData) };
  }

  const novoLook = await inserirNovoLook(
    parsed.data,
    derivado,
    varianteDeId ? { varianteDeId, slotsTrocados } : undefined,
  );
  await db
    .update(lookCandidatos)
    .set({ status: "aprovado" })
    .where(eq(lookCandidatos.id, candidatoId));

  revalidatePath("/looks");
  revalidatePath("/sugestoes-de-look");
  redirect(`/looks/${novoLook.id}`);
}
