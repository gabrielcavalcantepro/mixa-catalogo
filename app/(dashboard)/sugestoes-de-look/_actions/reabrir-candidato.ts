"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { lookCandidatos } from "@/db/schema";

/** Volta um candidato reprovado pra `pendente` — reaparece na fila normal. */
export async function reabrirCandidato(id: string) {
  await db.update(lookCandidatos).set({ status: "pendente" }).where(eq(lookCandidatos.id, id));
  revalidatePath("/sugestoes-de-look");
}
