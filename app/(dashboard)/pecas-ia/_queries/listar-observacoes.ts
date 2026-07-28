import { desc } from "drizzle-orm";
import { db } from "@/db";
import { buscaIaObservacoes } from "@/db/schema";

export async function listarObservacoesIa() {
  return db.select().from(buscaIaObservacoes).orderBy(desc(buscaIaObservacoes.criadoEm)).limit(30);
}
