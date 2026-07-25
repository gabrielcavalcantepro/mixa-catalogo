import { asc } from "drizzle-orm";
import { db } from "@/db";
import { perfisEstilo } from "@/db/schema";

export async function listarPerfis() {
  return db.select().from(perfisEstilo).orderBy(asc(perfisEstilo.nome));
}
