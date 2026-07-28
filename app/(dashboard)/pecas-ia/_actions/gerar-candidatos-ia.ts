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

const META_PENDENTES_NA_FILA = 10;
const TETO_TENTATIVAS = 30;
const NUMERO_MINIMO_COMBINACOES = 2;
const OBSERVACOES_RECENTES_LIMITE = 10;
const MAX_TENTATIVAS_GERACAO_LISTA = 3;
const ESPERA_ENTRE_RETENTATIVAS_MS = 1500;

function aguardar(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/**
 * Saída de LLM não é confiável por padrão (ver `gerar-lista.ts`) — uma
 * falha isolada (JSON malformado, resposta sem array reconhecível,
 * hiccup de rede) é normal e tipicamente transitória, não motivo pra
 * desistir da rodada inteira de 1 vez. Tenta de novo (com espera curta
 * entre tentativas) antes de propagar o erro pro chamador — que aí sim
 * marca `paradaPorErroDeGeracao` e encerra o laço. Loga o motivo real
 * de cada falha (`console.error`, visível nos logs de função do
 * Vercel) — antes o erro era descartado silenciosamente, sem trilha
 * nenhuma pra depurar se voltasse a acontecer.
 */
async function gerarListaComRetentativas(
  opcoes: Parameters<typeof gerarListaDePecas>[0],
): Promise<ItemGerado[]> {
  let ultimoErro: unknown;
  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS_GERACAO_LISTA; tentativa++) {
    try {
      return await gerarListaDePecas(opcoes);
    } catch (erro) {
      ultimoErro = erro;
      console.error(
        `[pecas-ia] gerarListaDePecas falhou (tentativa ${tentativa}/${MAX_TENTATIVAS_GERACAO_LISTA}):`,
        erro instanceof Error ? erro.message : erro,
      );
      if (tentativa < MAX_TENTATIVAS_GERACAO_LISTA) await aguardar(ESPERA_ENTRE_RETENTATIVAS_MS);
    }
  }
  throw ultimoErro;
}

export type GerarCandidatosIaResultado = {
  tentativas: number;
  tetoTentativas: number;
  pendentesNaFila: number;
  rejeitadasAuto: number;
  metaAtingida: boolean;
  tetoTentativasAtingido: boolean;
  paradaPorErroDeGeracao: boolean;
};

async function inserirCandidato(
  id: string,
  perfilEstiloIdOriginal: string,
  perfisEstiloIdsParaJuncao: string[],
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
      perfilEstiloId: perfilEstiloIdOriginal,
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
    await tx
      .insert(pecaCandidatoIaEstilo)
      .values(perfisEstiloIdsParaJuncao.map((perfilEstiloId) => ({ candidatoId: id, perfilEstiloId })));
  });
}

/**
 * Pipeline completo da busca por peça assistida por IA, pro perfil de
 * estilo escolhido: gera peças (OpenAI) → por peça, busca+baixa imagem
 * (OpenAI) → avalia se a imagem bate, extrai a cor real e julga quais
 * perfis de estilo (de todos os cadastrados, não só o escolhido na
 * geração) combinam com a foto (OpenAI, visão) → conta combinações no
 * catálogo atual (`contarCombinacoes`, regra pura, sem IA) → só o que
 * passa dos 3 filtros entra `pendente` na fila de revisão; o resto vira
 * `rejeitado` com o motivo automático. Cada peça é tratada isoladamente
 * (try/catch) — 1 falhar não derruba as outras.
 *
 * Multi-perfil (2026-07-28): uma peça pode combinar com mais de 1
 * perfil de estilo — o perfil originalmente escolhido pra gerar sempre
 * entra (`perfilEstiloId` continua sendo a FK singular em
 * `peca_candidato_ia`, "gerada pra qual perfil"), mais o que
 * `avaliarImagemBateComPeca` julgar olhando a foto de verdade
 * (`perfisEstiloIdsFinal`, gravado na tabela de junção
 * `peca_candidato_ia_estilo` — mesmo padrão de `peca_estilo`, que já
 * suporta múltiplos perfis por peça real). `contarCombinacoes` usa o
 * conjunto final (não só o original), já que a peça também combina com
 * looks dos perfis extras julgados.
 *
 * Meta, não tentativa única: continua gerando lotes novos (chamando
 * `gerarListaDePecas` de novo, passando os nomes já tentados pra
 * reduzir repetição) até `META_PENDENTES_NA_FILA` (10) peças
 * aprovadas de verdade, ou até `TETO_TENTATIVAS` (30) peças candidatas
 * tentadas no total — o que vier primeiro. Se o teto for atingido sem
 * chegar em 10, a função devolve normalmente com o que conseguiu
 * (`metaAtingida: false`) — nunca lança erro só por não ter fechado a
 * meta; quem chama (`buscar-form.tsx`) decide como avisar disso.
 * `itensParaEvitar` é só instrução de prompt (sem garantia, e não cobre
 * duplicata dentro do mesmo lote) — por isso existe também o dedup por
 * nome normalizado (`nomesJaTentadosNormalizados`) logo abaixo, que é
 * o que de fato impede peça repetida de virar 2 linhas na fila ou
 * gastar 2 tentativas do teto (2026-07-28: 1ª versão desse laço não
 * tinha esse dedup e a mensagem de "teto atingido" aparecia mesmo
 * quando o laço tinha parado cedo por erro na geração, não por
 * exaustão de tentativa de verdade — por isso `tetoTentativasAtingido`
 * e `paradaPorErroDeGeracao` são campos distintos no retorno, não só
 * `metaAtingida`). `gerarListaDePecas` roda via
 * `gerarListaComRetentativas` (até 3 tentativas com espera curta entre
 * elas) — uma falha isolada de LLM não deve encerrar a rodada inteira
 * sozinha; só depois de esgotar as retentativas é que
 * `paradaPorErroDeGeracao` é marcado de verdade.
 *
 * Roda como 1 Server Action síncrona (sem infra de fila neste projeto
 * ainda) — pode demorar por causa das chamadas de API externas em
 * sequência, e agora potencialmente mais de 10 tentativas; ver
 * CLAUDE.md.
 */
export async function gerarCandidatosIaAction(
  perfilEstiloId: string,
): Promise<GerarCandidatosIaResultado> {
  const perfil = await db.query.perfisEstilo.findFirst({
    where: eq(perfisEstilo.id, perfilEstiloId),
  });
  if (!perfil) throw new Error("Perfil de estilo não encontrado.");

  const [observacoesRecentes, capsulasRecentes, todasPecas, todosPerfis] = await Promise.all([
    db
      .select({ texto: buscaIaObservacoes.texto })
      .from(buscaIaObservacoes)
      .orderBy(desc(buscaIaObservacoes.criadoEm))
      .limit(OBSERVACOES_RECENTES_LIMITE),
    db.select({ id: capsulas.id }).from(capsulas).orderBy(desc(capsulas.dataLancamento)).limit(1),
    db.query.pecas.findMany({ with: { pesosClima: true, ocasioesBase: true, estilos: true } }),
    db
      .select({ id: perfisEstilo.id, nome: perfisEstilo.nome, descricao: perfisEstilo.descricao })
      .from(perfisEstilo),
  ]);

  const capsulaIdPadrao = capsulasRecentes[0]?.id;
  const pecasParaGeracao = todasPecas.map((p) => ({
    id: p.id,
    slot: p.slot,
    climas: p.pesosClima.map((pc) => pc.pesoClima),
    ocasioes: p.ocasioesBase.map((o) => o.ocasiao),
    perfis: p.estilos.map((e) => e.perfilEstiloId),
  }));

  let tentativas = 0;
  let pendentesNaFila = 0;
  let rejeitadasAuto = 0;
  let paradaPorErroDeGeracao = false;
  const nomesJaTentados: string[] = [];
  const nomesJaTentadosNormalizados = new Set<string>();

  while (pendentesNaFila < META_PENDENTES_NA_FILA && tentativas < TETO_TENTATIVAS) {
    let itens: ItemGerado[];
    try {
      itens = await gerarListaComRetentativas({
        nomeEstilo: perfil.nome,
        observacoesRecentes: observacoesRecentes.map((o) => o.texto),
        itensParaEvitar: nomesJaTentados,
      });
    } catch {
      paradaPorErroDeGeracao = true;
      break;
    }

    for (const item of itens) {
      if (pendentesNaFila >= META_PENDENTES_NA_FILA || tentativas >= TETO_TENTATIVAS) break;

      // Repetição: o `itensParaEvitar` acima é só instrução de prompt,
      // sem garantia (nem cobre duplicata dentro do mesmo lote) — este
      // check é o que de fato impede a mesma peça de virar 2 linhas na
      // fila ou gastar 2 tentativas do teto de 30.
      const nomeNormalizado = item.nome.trim().toLowerCase();
      if (nomesJaTentadosNormalizados.has(nomeNormalizado)) continue;
      nomesJaTentadosNormalizados.add(nomeNormalizado);

      tentativas++;
      nomesJaTentados.push(item.nome);
      const candidatoId = randomUUID();

      try {
        const encontrada = await buscarImagemDaPeca(`${item.nome}, cor ${item.corValor}`);
        if (!encontrada) {
          await inserirCandidato(candidatoId, perfilEstiloId, [perfilEstiloId], item, "rejeitado", {
            capsulaId: capsulaIdPadrao,
            motivo: "Nenhuma imagem encontrada na busca.",
          });
          rejeitadasAuto++;
          continue;
        }

        const imagemUrl = await baixarEHospedarImagem(
          encontrada.imageUri,
          `pecas-ia/${candidatoId}`,
        );
        if (!imagemUrl) {
          await inserirCandidato(candidatoId, perfilEstiloId, [perfilEstiloId], item, "rejeitado", {
            capsulaId: capsulaIdPadrao,
            motivo: "Falha ao baixar/hospedar a imagem encontrada.",
            linkOrigemImagem: encontrada.sourceUri,
          });
          rejeitadasAuto++;
          continue;
        }

        const avaliacao = await avaliarImagemBateComPeca(imagemUrl, item.nome, todosPerfis);
        if (!avaliacao.bate) {
          await inserirCandidato(candidatoId, perfilEstiloId, [perfilEstiloId], item, "rejeitado", {
            capsulaId: capsulaIdPadrao,
            motivo: "Avaliação de imagem: não corresponde à peça pedida.",
            imagemUrl,
            linkOrigemImagem: encontrada.sourceUri,
          });
          rejeitadasAuto++;
          continue;
        }
        if (!avaliacao.fundoNeutro) {
          await inserirCandidato(candidatoId, perfilEstiloId, [perfilEstiloId], item, "rejeitado", {
            capsulaId: capsulaIdPadrao,
            motivo: "Avaliação de imagem: fundo não é neutro (não é padrão de loja).",
            imagemUrl,
            linkOrigemImagem: encontrada.sourceUri,
          });
          rejeitadasAuto++;
          continue;
        }

        // A cor real observada na foto substitui o chute do passo 1
        // (gerarListaDePecas nunca viu imagem nenhuma) — ver CLAUDE.md.
        const itemComCorReal: ItemGerado = {
          ...item,
          corValor: avaliacao.corValor ?? item.corValor,
          corTipo: avaliacao.corTipo ?? item.corTipo,
        };

        // Perfil originalmente pedido sempre entra, mais o que a visão
        // julgou que também combina (uma peça pode caber em mais de 1
        // perfil — ver CLAUDE.md).
        const perfisEstiloIdsFinal = Array.from(
          new Set([perfilEstiloId, ...avaliacao.perfisEstiloIds]),
        );

        const numeroCombinacoes = contarCombinacoes(
          {
            slot: itemComCorReal.slot,
            climas: itemComCorReal.pesoClima,
            ocasioes: itemComCorReal.ocasiaoBase,
            perfis: perfisEstiloIdsFinal,
          },
          pecasParaGeracao,
        );
        if (numeroCombinacoes < NUMERO_MINIMO_COMBINACOES) {
          await inserirCandidato(
            candidatoId,
            perfilEstiloId,
            perfisEstiloIdsFinal,
            itemComCorReal,
            "rejeitado",
            {
              capsulaId: capsulaIdPadrao,
              motivo: `Poucas combinações no catálogo atual (${numeroCombinacoes}).`,
              imagemUrl,
              linkOrigemImagem: encontrada.sourceUri,
              numeroCombinacoes,
            },
          );
          rejeitadasAuto++;
          continue;
        }

        await inserirCandidato(
          candidatoId,
          perfilEstiloId,
          perfisEstiloIdsFinal,
          itemComCorReal,
          "pendente",
          {
            capsulaId: capsulaIdPadrao,
            imagemUrl,
            linkOrigemImagem: encontrada.sourceUri,
            numeroCombinacoes,
          },
        );
        pendentesNaFila++;
      } catch (erro) {
        await inserirCandidato(candidatoId, perfilEstiloId, [perfilEstiloId], item, "rejeitado", {
          capsulaId: capsulaIdPadrao,
          motivo: erro instanceof Error ? `Erro: ${erro.message}` : "Erro desconhecido ao processar.",
        });
        rejeitadasAuto++;
      }
    }
  }

  revalidatePath("/pecas-ia");
  return {
    tentativas,
    tetoTentativas: TETO_TENTATIVAS,
    pendentesNaFila,
    rejeitadasAuto,
    metaAtingida: pendentesNaFila >= META_PENDENTES_NA_FILA,
    tetoTentativasAtingido: tentativas >= TETO_TENTATIVAS,
    paradaPorErroDeGeracao,
  };
}
