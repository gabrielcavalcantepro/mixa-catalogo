"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  lookCandidatoClimas,
  lookCandidatoOcasioesSugeridas,
  lookCandidatoPecas,
  lookCandidatoPerfisSugeridos,
  lookCandidatos,
} from "@/db/schema";
import { calcularFingerprint } from "../_lib/calcular-fingerprint";
import { gerarCandidatos, type PecaParaGeracao } from "../_lib/gerar-candidatos";

export type GerarCandidatosResultado = {
  gerados: number;
  truncado: boolean;
};

export async function gerarCandidatosAction(): Promise<GerarCandidatosResultado> {
  const [todasPecas, todosLooks, candidatosExistentes] = await Promise.all([
    db.query.pecas.findMany({
      with: { pesosClima: true, ocasioesBase: true, estilos: true },
    }),
    db.query.looks.findMany({ with: { pecas: true } }),
    db.query.lookCandidatos.findMany({ columns: { fingerprint: true } }),
  ]);

  const pecasParaGeracao: PecaParaGeracao[] = todasPecas.map((p) => ({
    id: p.id,
    slot: p.slot,
    climas: p.pesosClima.map((pc) => pc.pesoClima),
    ocasioes: p.ocasioesBase.map((o) => o.ocasiao),
    perfis: p.estilos.map((e) => e.perfilEstiloId),
  }));

  const assinaturasExistentes = new Set<string>();
  for (const look of todosLooks) {
    const pecasPorSlot = Object.fromEntries(look.pecas.map((lp) => [lp.slot, lp.pecaId]));
    assinaturasExistentes.add(calcularFingerprint(pecasPorSlot));
  }
  for (const c of candidatosExistentes) {
    assinaturasExistentes.add(c.fingerprint);
  }

  const { candidatos, truncado } = gerarCandidatos(pecasParaGeracao, assinaturasExistentes);

  for (const candidato of candidatos) {
    await db.transaction(async (tx) => {
      const [inserido] = await tx
        .insert(lookCandidatos)
        .values({ fingerprint: candidato.fingerprint })
        .onConflictDoNothing({ target: lookCandidatos.fingerprint })
        .returning();
      if (!inserido) return; // corrida rara com outra geração — assinatura já existe

      await Promise.all([
        tx.insert(lookCandidatoPecas).values(
          Object.entries(candidato.pecasPorSlot).map(([slot, pecaId]) => ({
            candidatoId: inserido.id,
            slot: slot as (typeof lookCandidatoPecas.$inferInsert)["slot"],
            pecaId,
          })),
        ),
        candidato.climas.length > 0
          ? tx.insert(lookCandidatoClimas).values(
              candidato.climas.map((c) => ({
                candidatoId: inserido.id,
                pesoClima: c as (typeof lookCandidatoClimas.$inferInsert)["pesoClima"],
              })),
            )
          : Promise.resolve(),
        tx.insert(lookCandidatoOcasioesSugeridas).values(
          candidato.ocasioesSugeridas.map((o) => ({
            candidatoId: inserido.id,
            ocasiao: o as (typeof lookCandidatoOcasioesSugeridas.$inferInsert)["ocasiao"],
          })),
        ),
        candidato.perfisSugeridos.length > 0
          ? tx.insert(lookCandidatoPerfisSugeridos).values(
              candidato.perfisSugeridos.map((perfilEstiloId) => ({
                candidatoId: inserido.id,
                perfilEstiloId,
              })),
            )
          : Promise.resolve(),
      ]);
    });
  }

  revalidatePath("/sugestoes-de-look");
  return { gerados: candidatos.length, truncado };
}
