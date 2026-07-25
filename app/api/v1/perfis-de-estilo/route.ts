import { NextResponse } from "next/server";
import { db } from "@/db";
import { perfisEstilo } from "@/db/schema";
import { verificarAutenticacao } from "../_lib/autenticar";

/** GET /api/v1/perfis-de-estilo — lista simples para onboarding do app. */
export async function GET(request: Request) {
  const erroAuth = verificarAutenticacao(request);
  if (erroAuth) return erroAuth;

  const perfis = await db
    .select({ id: perfisEstilo.id, nome: perfisEstilo.nome, descricao: perfisEstilo.descricao })
    .from(perfisEstilo);

  return NextResponse.json(perfis);
}
