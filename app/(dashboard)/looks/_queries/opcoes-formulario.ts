import { asc } from "drizzle-orm";
import { db } from "@/db";
import { perfisEstilo } from "@/db/schema";

/**
 * Dados de referência (peças por slot, perfis de estilo) para popular o
 * builder de look. Consulta local à fatia de looks — não importa código
 * interno da fatia de peças/perfis de estilo.
 */
export async function listarOpcoesFormulario() {
  const [pecas, perfis] = await Promise.all([
    db.query.pecas.findMany({
      orderBy: (peca, { asc }) => [asc(peca.nome)],
      with: { imagens: true },
    }),
    db.select().from(perfisEstilo).orderBy(asc(perfisEstilo.nome)),
  ]);

  return { pecas, perfis };
}
