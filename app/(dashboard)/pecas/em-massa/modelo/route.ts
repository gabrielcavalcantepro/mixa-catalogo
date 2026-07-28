import { auth } from "@/lib/auth";
import { listarOpcoesFormulario } from "../../_queries/opcoes-formulario";
import { gerarModeloPlanilha } from "../_lib/planilha";

/**
 * GET /pecas/em-massa/modelo — gera o .xlsx na hora (nunca serve um
 * arquivo fixo salvo), com a lista de cápsulas atual no momento do
 * download. Route Handler não passa pelo `layout.tsx` do dashboard
 * (mesma observação de app/api/v1/ no CLAUDE.md) — sessão checada
 * manualmente aqui.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new Response("Não autenticado.", { status: 401 });
  }

  const opcoes = await listarOpcoesFormulario();
  const buffer = await gerarModeloPlanilha({ capsulas: opcoes.capsulas, perfis: opcoes.perfis });

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="modelo-cadastro-pecas-mixa.xlsx"',
    },
  });
}
