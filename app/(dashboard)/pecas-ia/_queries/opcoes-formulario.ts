import { asc, desc } from "drizzle-orm";
import { db } from "@/db";
import { capsulas, perfisEstilo } from "@/db/schema";

/**
 * Dados de referência (cápsula, perfil de estilo) — consulta local à
 * fatia, mesmo padrão de pecas/_queries/opcoes-formulario.ts (cada
 * tela escreve a própria query pequena em vez de importar de outra).
 */
export async function listarOpcoesFormulario() {
  const [listaCapsulas, listaPerfis] = await Promise.all([
    db.select().from(capsulas).orderBy(desc(capsulas.dataLancamento)),
    db.select().from(perfisEstilo).orderBy(asc(perfisEstilo.nome)),
  ]);

  return { capsulas: listaCapsulas, perfis: listaPerfis };
}
