"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { looks } from "@/db/schema";
import type { LookActionState } from "../_lib/schema";

export async function excluirLook(id: string): Promise<LookActionState> {
  try {
    await db.delete(looks).where(eq(looks.id, id));
  } catch {
    return {
      erro: "Esse look é a base de alguma variante e não pode ser excluído.",
    };
  }
  revalidatePath("/looks");
  return undefined;
}
