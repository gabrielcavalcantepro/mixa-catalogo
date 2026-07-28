"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { pecaCandidatosIa } from "@/db/schema";

/** Chamada quando o admin remove uma linha vinda da busca por IA na tela de revisão. */
export async function rejeitarCandidatoIaAction(candidatoId: string): Promise<void> {
  await db
    .update(pecaCandidatosIa)
    .set({ status: "rejeitado", decididoEm: new Date() })
    .where(eq(pecaCandidatosIa.id, candidatoId));
  revalidatePath("/pecas-ia");
}
