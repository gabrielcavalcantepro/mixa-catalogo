"use server";

import { randomUUID } from "crypto";
import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  buscaIaObservacoes,
  capsulas,
  pecaCandidatoIaEstilo,
  pecaCandidatoIaOcasiaoBase,
  pecaCandidatoIaPesoClima,
  pecaCandidatosIa,
  perfisEstilo,
} from "@/db/schema";
import { avaliarImagemBateComPeca } from "../_lib/avaliar-imagem";
import { baixarEHospedarImagem } from "../_lib/baixar-e-hospedar-imagem";
import { buscarImagemDaPeca } from "../_lib/buscar-imagem";
import { contarCombinacoes } from "../_lib/contar-combinacoes";
import { gerarListaDePecas, type ItemGerado } from "../_lib/gerar-lista";

const QUANTIDADE_POR_RODADA = 10;
const NUMERO_MINIMO_COMBINACOES = 5;
const OBSERVACOES_RECENTES_LIMITE = 10;

export type GerarCandidatosIaResultado = {
  geradas: number;
  pendentesNaFila: number;
  rejeitadasAuto: number;
};

async function inserirCandidato(
  id: string,
  perfilEstiloId: string,
  item: ItemGerado,
  status: "pendente" | "rejeitado",
  opcoes: {
    capsulaId?: string;
    motivo?: string;
    imagemUrl?: string;
    linkOrigemImagem?: string | null;
    numeroCombinacoes?: number;
  },
) {
  await db.transaction(async (tx) => {
    await tx.insert(pecaCandidatosIa).values({
      id,
      perfilEstiloId,
      status,
      motivoRejeicaoAutomatica: opcoes.motivo,
      nome: item.nome,
      slot: item.slot,
      corTipo: item.corTipo,
      corValor: item.corValor,
      capsulaId: opcoes.capsulaId,
      pecaChave: item.pecaChave,
      imagemUrl: opcoes.imagemUrl,
      linkOrigemImagem: opcoes.linkOrigemImagem,
      numeroCombinacoes: opcoes.numeroCombinacoes,
      decididoEm: status === "rejeitado" ? new Date() : null,
    });
    if (item.pesoClima.length > 0) {
      await tx
        .insert(pecaCandidatoIaPesoClima)
        .values(item.pesoClima.map((p) => ({ candidatoId: id, pesoClima: p })));
    }
    await tx
      .insert(pecaCandidatoIaOcasiaoBase)
      .values(item.ocasiaoBase.map((o) => ({ candidatoId: id, ocasiao: o })));
    await tx.insert(pecaCandidatoIaEstilo).values({ candidatoId: id, perfilEstiloId });
  });
}

/**
 * Pipeline completo da busca por peça assistida por IA, pro perfil de
 * estilo escolhido: gera 10 peças (Gemini) → por peça, busca+baixa
 * imagem (Gemini) → avalia se a imagem bate (OpenAI, visão) → conta
 * combinações no catálogo atual (`contarCombinacoes`, regra pura, sem
 * IA) → só o que passa dos 3 filtros entra `pendente` na fila de
 * revisão; o resto vira `rejeitado` com o motivo automático. Cada
 * peça é tratada isoladamente (try/catch) — 1 falhar não derruba as
 * outras 9.
 *
 * Roda como 1 Server Action síncrona (sem infra de fila neste projeto
 * ainda) — pode demorar por causa das chamadas de API externas em
 * sequência; ver CLAUDE.md.
 */
export async function gerarCandidatosIaAction(
  perfilEstiloId: string,
): Promise<GerarCandidatosIaResultado> {
  const perfil = await db.query.perfisEstilo.findFirst({
    where: eq(perfisEstilo.id, perfilEstiloId),
  });
  if (!perfil) throw new Error("Perfil de estilo não encontrado.");

  const [observacoesRecentes, capsulasRecentes, todasPecas] = await Promise.all([
    db
      .select({ texto: buscaIaObservacoes.texto })
      .from(buscaIaObservacoes)
      .orderBy(desc(buscaIaObservacoes.criadoEm))
      .limit(OBSERVACOES_RECENTES_LIMITE),
    db.select({ id: capsulas.id }).from(capsulas).orderBy(desc(capsulas.dataLancamento)).limit(1),
    db.query.pecas.findMany({ with: { pesosClima: true, ocasioesBase: true, estilos: true } }),
  ]);

  const capsulaIdPadrao = capsulasRecentes[0]?.id;
  const pecasParaGeracao = todasPecas.map((p) => ({
    id: p.id,
    slot: p.slot,
    climas: p.pesosClima.map((pc) => pc.pesoClima),
    ocasioes: p.ocasioesBase.map((o) => o.ocasiao),
    perfis: p.estilos.map((e) => e.perfilEstiloId),
  }));

  const itens = await gerarListaDePecas({
    nomeEstilo: perfil.nome,
    observacoesRecentes: observacoesRecentes.map((o) => o.texto),
  });

  let pendentesNaFila = 0;
  let rejeitadasAuto = 0;

  for (const item of itens.slice(0, QUANTIDADE_POR_RODADA)) {
    const candidatoId = randomUUID();

    try {
      const encontrada = await buscarImagemDaPeca(`${item.nome}, cor ${item.corValor}`);
      if (!encontrada) {
        await inserirCandidato(candidatoId, perfilEstiloId, item, "rejeitado", {
          capsulaId: capsulaIdPadrao,
          motivo: "Nenhuma imagem encontrada na busca.",
        });
        rejeitadasAuto++;
        continue;
      }

      const imagemUrl = await baixarEHospedarImagem(encontrada.imageUri, `pecas-ia/${candidatoId}`);
      if (!imagemUrl) {
        await inserirCandidato(candidatoId, perfilEstiloId, item, "rejeitado", {
          capsulaId: capsulaIdPadrao,
          motivo: "Falha ao baixar/hospedar a imagem encontrada.",
          linkOrigemImagem: encontrada.sourceUri,
        });
        rejeitadasAuto++;
        continue;
      }

      const bate = await avaliarImagemBateComPeca(imagemUrl, item.nome);
      if (!bate) {
        await inserirCandidato(candidatoId, perfilEstiloId, item, "rejeitado", {
          capsulaId: capsulaIdPadrao,
          motivo: "Avaliação de imagem: não corresponde à peça pedida.",
          imagemUrl,
          linkOrigemImagem: encontrada.sourceUri,
        });
        rejeitadasAuto++;
        continue;
      }

      const numeroCombinacoes = contarCombinacoes(
        {
          slot: item.slot,
          climas: item.pesoClima,
          ocasioes: item.ocasiaoBase,
          perfis: [perfilEstiloId],
        },
        pecasParaGeracao,
      );
      if (numeroCombinacoes < NUMERO_MINIMO_COMBINACOES) {
        await inserirCandidato(candidatoId, perfilEstiloId, item, "rejeitado", {
          capsulaId: capsulaIdPadrao,
          motivo: `Poucas combinações no catálogo atual (${numeroCombinacoes}).`,
          imagemUrl,
          linkOrigemImagem: encontrada.sourceUri,
          numeroCombinacoes,
        });
        rejeitadasAuto++;
        continue;
      }

      await inserirCandidato(candidatoId, perfilEstiloId, item, "pendente", {
        capsulaId: capsulaIdPadrao,
        imagemUrl,
        linkOrigemImagem: encontrada.sourceUri,
        numeroCombinacoes,
      });
      pendentesNaFila++;
    } catch (erro) {
      await inserirCandidato(candidatoId, perfilEstiloId, item, "rejeitado", {
        capsulaId: capsulaIdPadrao,
        motivo: erro instanceof Error ? `Erro: ${erro.message}` : "Erro desconhecido ao processar.",
      });
      rejeitadasAuto++;
    }
  }

  revalidatePath("/pecas-ia");
  return { geradas: itens.length, pendentesNaFila, rejeitadasAuto };
}
