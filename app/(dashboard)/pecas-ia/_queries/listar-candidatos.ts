import { asc, desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { pecaCandidatosIa } from "@/db/schema";

const COM_RELACOES = {
  pesosClima: true,
  ocasioesBase: true,
  estilos: true,
} as const;

export async function listarCandidatosPendentesIa() {
  return db.query.pecaCandidatosIa.findMany({
    where: (candidato, { eq }) => eq(candidato.status, "pendente"),
    orderBy: asc(pecaCandidatosIa.criadoEm),
    with: COM_RELACOES,
  });
}

/** Aprovado/rejeitado/desfeito, mais recentes primeiro — pra aba Histórico. */
export async function listarHistoricoIa() {
  return db.query.pecaCandidatosIa.findMany({
    where: inArray(pecaCandidatosIa.status, ["aprovado", "rejeitado", "desfeito"]),
    orderBy: desc(pecaCandidatosIa.decididoEm),
    with: { perfilEstilo: true },
    limit: 50,
  });
}
