"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { pecaImagens, pecas } from "@/db/schema";
import { storage } from "@/lib/storage";
import type { PecaActionState } from "../_lib/schema";

export async function excluirPeca(id: string): Promise<PecaActionState> {
  const imagens = await db.select().from(pecaImagens).where(eq(pecaImagens.pecaId, id));

  try {
    await db.delete(pecas).where(eq(pecas.id, id));
  } catch {
    return { erro: "Essa peça está em uso em algum look e não pode ser excluída." };
  }

  await Promise.all(imagens.map((img) => storage.remover(img.url)));
  revalidatePath("/pecas");
  return undefined;
}
