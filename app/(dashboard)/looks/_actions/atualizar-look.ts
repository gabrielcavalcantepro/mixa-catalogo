"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  lookClimas,
  lookOcasioes,
  lookPecas,
  lookPerfisEstilo,
  looks,
} from "@/db/schema";
import { extrairValoresLook, formDataParaLook, type LookActionState } from "../_lib/schema";
import { validarPecasEDerivar } from "./_inserir-look";

export async function atualizarLook(
  id: string,
  _estadoAnterior: LookActionState,
  formData: FormData,
): Promise<LookActionState> {
  const parsed = formDataParaLook(formData);
  if (!parsed.success) {
    return { erro: parsed.error.issues[0].message, valores: extrairValoresLook(formData) };
  }

  const { nome, ocasiao, perfilEstiloIds, pecasPorSlot } = parsed.data;

  const derivado = await validarPecasEDerivar(pecasPorSlot);
  if ("erro" in derivado) {
    return { erro: derivado.erro, valores: extrairValoresLook(formData) };
  }
  const { capsulaId, clima } = derivado;

  await db.transaction(async (tx) => {
    await tx
      .update(looks)
      .set({ nome, capsulaId, climaMisto: clima.misto, atualizadoEm: new Date() })
      .where(eq(looks.id, id));

    await tx.delete(lookPecas).where(eq(lookPecas.lookId, id));
    await tx.delete(lookOcasioes).where(eq(lookOcasioes.lookId, id));
    await tx.delete(lookPerfisEstilo).where(eq(lookPerfisEstilo.lookId, id));
    await tx.delete(lookClimas).where(eq(lookClimas.lookId, id));

    await Promise.all([
      tx
        .insert(lookPecas)
        .values(
          Object.entries(pecasPorSlot).map(([slot, pecaId]) => ({
            lookId: id,
            slot: slot as (typeof lookPecas.$inferInsert)["slot"],
            pecaId,
          })),
        ),
      tx.insert(lookOcasioes).values(ocasiao.map((o) => ({ lookId: id, ocasiao: o }))),
      tx
        .insert(lookPerfisEstilo)
        .values(perfilEstiloIds.map((pid) => ({ lookId: id, perfilEstiloId: pid }))),
      clima.climas.length > 0
        ? tx.insert(lookClimas).values(
            clima.climas.map((c) => ({
              lookId: id,
              pesoClima: c as (typeof lookClimas.$inferInsert)["pesoClima"],
            })),
          )
        : Promise.resolve(),
    ]);
  });

  revalidatePath("/looks");
  redirect(`/looks/${id}`);
}
