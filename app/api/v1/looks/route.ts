import { NextResponse } from "next/server";
import { db } from "@/db";
import { verificarAutenticacao } from "../_lib/autenticar";
import { mapearLook } from "./_lib/mapear";

/**
 * GET /api/v1/looks — toda linha de `look` (não existe status nessa
 * tabela; a fila `look_candidato` pendente/reprovada nunca é lida aqui).
 */
export async function GET(request: Request) {
  const erroAuth = verificarAutenticacao(request);
  if (erroAuth) return erroAuth;

  const looks = await db.query.looks.findMany({
    orderBy: (look, { desc }) => [desc(look.criadoEm)],
    with: {
      capsula: true,
      varianteDe: true,
      pecas: { with: { peca: { with: { imagens: true } } } },
      ocasioes: true,
      perfisEstilo: { with: { perfilEstilo: true } },
      slotsTrocados: true,
      climas: true,
    },
  });

  return NextResponse.json(looks.map(mapearLook));
}
