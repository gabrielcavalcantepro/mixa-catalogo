import { NextResponse } from "next/server";
import { db } from "@/db";
import { verificarAutenticacao } from "../_lib/autenticar";
import { mapearPeca } from "./_lib/mapear";

/** GET /api/v1/pecas — todo o catálogo (imagem + link de compra + dados estruturados). */
export async function GET(request: Request) {
  const erroAuth = verificarAutenticacao(request);
  if (erroAuth) return erroAuth;

  const pecas = await db.query.pecas.findMany({
    orderBy: (peca, { desc }) => [desc(peca.criadoEm)],
    with: {
      capsula: true,
      imagens: true,
      pesosClima: true,
      ocasioesBase: true,
      estilos: { with: { perfilEstilo: true } },
    },
  });

  return NextResponse.json(pecas.map(mapearPeca));
}
