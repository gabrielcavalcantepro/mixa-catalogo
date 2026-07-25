import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { lookCandidatos } from "@/db/schema";

const COM_RELACOES = {
  pecas: { with: { peca: { with: { imagens: true } } } },
  climas: true,
  ocasioesSugeridas: true,
  perfisSugeridos: { with: { perfilEstilo: true } },
} as const;

export async function listarCandidatosPendentes() {
  return db.query.lookCandidatos.findMany({
    where: eq(lookCandidatos.status, "pendente"),
    orderBy: asc(lookCandidatos.criadoEm),
    with: COM_RELACOES,
  });
}

export async function listarCandidatosReprovados() {
  return db.query.lookCandidatos.findMany({
    where: eq(lookCandidatos.status, "reprovado"),
    orderBy: asc(lookCandidatos.criadoEm),
    with: COM_RELACOES,
  });
}
