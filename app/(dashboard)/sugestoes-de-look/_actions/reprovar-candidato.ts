"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { lookCandidatos } from "@/db/schema";

/**
 * Só troca o status pra `reprovado` — a linha (e a assinatura em
 * `fingerprint`) continua existindo pra sempre, é assim que essa
 * combinação nunca mais reaparece numa geração futura, a não ser que
 * seja reaberta (`reabrir-candidato.ts`).
 */
export async function reprovarCandidato(id: string) {
  await db.update(lookCandidatos).set({ status: "reprovado" }).where(eq(lookCandidatos.id, id));
  revalidatePath("/sugestoes-de-look");
}
