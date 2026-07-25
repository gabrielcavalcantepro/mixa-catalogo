import { desc } from "drizzle-orm";
import { db } from "@/db";
import { capsulas } from "@/db/schema";

export async function listarCapsulas() {
  return db.select().from(capsulas).orderBy(desc(capsulas.dataLancamento));
}
