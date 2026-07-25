import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

function compararSeguro(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Checa o header `Authorization: Bearer <API_TOKEN>` das rotas de leitura
 * pro app Mixa (`app/api/v1/*`). Devolve a resposta de erro pronta
 * (401/500) se a checagem falhar, ou `null` se pode seguir — assim cada
 * `route.ts` só faz:
 * `const erro = verificarAutenticacao(request); if (erro) return erro;`
 *
 * `tokenEsperado` é parâmetro (não lido direto de `process.env` lá
 * dentro) só pra dar pra testar sem mexer em variável de ambiente global.
 */
export function verificarAutenticacao(
  request: Request,
  tokenEsperado = process.env.API_TOKEN,
): NextResponse | null {
  if (!tokenEsperado) {
    return NextResponse.json(
      { erro: "API não configurada (falta API_TOKEN)." },
      { status: 500 },
    );
  }

  const cabecalho = request.headers.get("authorization") ?? "";
  const [esquema, token] = cabecalho.split(" ");
  if (esquema !== "Bearer" || !token || !compararSeguro(token, tokenEsperado)) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  return null;
}
