import { asc, desc } from "drizzle-orm";
import { db } from "@/db";
import { capsulas, perfisEstilo } from "@/db/schema";

/**
 * Dados de referência (cápsula, perfil de estilo) usados só para popular
 * selects deste formulário. Consulta local à fatia — a fatia de peças não
 * importa código interno das fatias de cápsulas/perfis de estilo.
 */
export async function listarOpcoesFormulario() {
  const [listaCapsulas, listaPerfis] = await Promise.all([
    db.select().from(capsulas).orderBy(desc(capsulas.dataLancamento)),
    db.select().from(perfisEstilo).orderBy(asc(perfisEstilo.nome)),
  ]);

  return { capsulas: listaCapsulas, perfis: listaPerfis };
}
