import { desc } from "drizzle-orm";
import { db } from "@/db";
import { capsulas } from "@/db/schema";

/** Referência só para popular o filtro de cápsula desta tela. */
export async function listarCapsulasReferencia() {
  return db.select().from(capsulas).orderBy(desc(capsulas.dataLancamento));
}
