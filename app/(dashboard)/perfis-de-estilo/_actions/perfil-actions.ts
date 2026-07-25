"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { perfisEstilo } from "@/db/schema";

const perfilSchema = z.object({
  nome: z.string().trim().min(1, "Informe um nome."),
  descricao: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null)),
});

export type PerfilActionState = { erro?: string } | undefined;

export async function criarPerfil(
  _estadoAnterior: PerfilActionState,
  formData: FormData,
): Promise<PerfilActionState> {
  const parsed = perfilSchema.safeParse({
    nome: formData.get("nome"),
    descricao: formData.get("descricao"),
  });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0].message };
  }

  try {
    await db.insert(perfisEstilo).values(parsed.data);
  } catch {
    return { erro: "Já existe um perfil de estilo com esse nome." };
  }

  revalidatePath("/perfis-de-estilo");
  return undefined;
}

export async function atualizarPerfil(
  id: string,
  _estadoAnterior: PerfilActionState,
  formData: FormData,
): Promise<PerfilActionState> {
  const parsed = perfilSchema.safeParse({
    nome: formData.get("nome"),
    descricao: formData.get("descricao"),
  });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0].message };
  }

  try {
    await db.update(perfisEstilo).set(parsed.data).where(eq(perfisEstilo.id, id));
  } catch {
    return { erro: "Já existe um perfil de estilo com esse nome." };
  }

  revalidatePath("/perfis-de-estilo");
  return undefined;
}

export async function excluirPerfil(id: string): Promise<PerfilActionState> {
  try {
    await db.delete(perfisEstilo).where(eq(perfisEstilo.id, id));
  } catch {
    return {
      erro: "Esse perfil está em uso em peças ou looks e não pode ser excluído.",
    };
  }
  revalidatePath("/perfis-de-estilo");
  return undefined;
}
