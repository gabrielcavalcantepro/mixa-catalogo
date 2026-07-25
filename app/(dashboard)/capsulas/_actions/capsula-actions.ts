"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { capsulas } from "@/db/schema";

const capsulaSchema = z.object({
  nome: z.string().trim().min(1, "Informe um nome."),
  dataLancamento: z.coerce.date({ error: "Informe uma data válida." }),
});

export type CapsulaActionState = { erro?: string } | undefined;

export async function criarCapsula(
  _estadoAnterior: CapsulaActionState,
  formData: FormData,
): Promise<CapsulaActionState> {
  const parsed = capsulaSchema.safeParse({
    nome: formData.get("nome"),
    dataLancamento: formData.get("dataLancamento"),
  });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0].message };
  }

  try {
    await db.insert(capsulas).values(parsed.data);
  } catch {
    return { erro: "Já existe uma cápsula com esse nome." };
  }

  revalidatePath("/capsulas");
  return undefined;
}

export async function atualizarCapsula(
  id: string,
  _estadoAnterior: CapsulaActionState,
  formData: FormData,
): Promise<CapsulaActionState> {
  const parsed = capsulaSchema.safeParse({
    nome: formData.get("nome"),
    dataLancamento: formData.get("dataLancamento"),
  });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0].message };
  }

  try {
    await db.update(capsulas).set(parsed.data).where(eq(capsulas.id, id));
  } catch {
    return { erro: "Já existe uma cápsula com esse nome." };
  }

  revalidatePath("/capsulas");
  return undefined;
}

export async function excluirCapsula(id: string): Promise<CapsulaActionState> {
  try {
    await db.delete(capsulas).where(eq(capsulas.id, id));
  } catch {
    return {
      erro: "Essa cápsula está em uso em peças ou looks e não pode ser excluída.",
    };
  }
  revalidatePath("/capsulas");
  return undefined;
}
