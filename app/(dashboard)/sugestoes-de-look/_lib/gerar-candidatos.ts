import { calcularFingerprint } from "./calcular-fingerprint";

/** Duplicado de pecas/_lib/schema.ts de propósito (fatia autocontida). */
const SLOTS_COM_CLIMA = ["parte_de_cima", "parte_de_baixo", "peca_unica", "calcado"] as const;

const SLOTS_OPCIONAIS = ["sobreposicao", "cinto", "bolsa", "acessorio_outro"] as const;

export type PecaParaGeracao = {
  id: string;
  slot: string;
  climas: string[];
  ocasioes: string[];
  perfis: string[];
};

export type CandidatoGerado = {
  fingerprint: string;
  pecasPorSlot: Record<string, string>;
  climas: string[];
  ocasioesSugeridas: string[];
  perfisSugeridos: string[];
};

type Estado = {
  pecasPorSlot: Record<string, string>;
  // null = nenhuma peça relevante entrou ainda (ainda não restringe nada).
  climas: string[] | null;
  ocasioes: string[] | null;
  perfis: string[] | null;
};

function intersecaoOuInicial(atual: string[] | null, novo: string[]): string[] {
  return atual === null ? novo : atual.filter((v) => novo.includes(v));
}

/**
 * Tenta acrescentar uma peça a uma combinação parcial. Retorna `null`
 * (poda) se isso zerar a interseção de clima (só quando o slot tem
 * clima) ou de ocasião (sempre) — perfil de estilo nunca poda, só é
 * sugestão.
 */
function tentarAdicionar(estado: Estado, peca: PecaParaGeracao): Estado | null {
  const novasOcasioes = intersecaoOuInicial(estado.ocasioes, peca.ocasioes);
  if (novasOcasioes.length === 0) return null;

  const climaAplicavel = SLOTS_COM_CLIMA.includes(peca.slot as (typeof SLOTS_COM_CLIMA)[number]);
  const novosClimas = climaAplicavel
    ? intersecaoOuInicial(estado.climas, peca.climas)
    : estado.climas;
  if (climaAplicavel && novosClimas !== null && novosClimas.length === 0) return null;

  const novosPerfis = intersecaoOuInicial(estado.perfis, peca.perfis);

  return {
    pecasPorSlot: { ...estado.pecasPorSlot, [peca.slot]: peca.id },
    climas: novosClimas,
    ocasioes: novasOcasioes,
    perfis: novosPerfis,
  };
}

const ESTADO_VAZIO: Estado = { pecasPorSlot: {}, climas: null, ocasioes: null, perfis: null };

export function gerarCandidatos(
  todasPecas: PecaParaGeracao[],
  assinaturasExistentes: Iterable<string>,
  opcoes: { tetoCombinacoesParciais?: number } = {},
): { candidatos: CandidatoGerado[]; truncado: boolean } {
  const teto = opcoes.tetoCombinacoesParciais ?? 500;
  const porSlot = (slot: string) => todasPecas.filter((p) => p.slot === slot);

  // 1. Corpo: peça única OU topo+base (nunca os dois).
  const corpos: Estado[] = [];
  for (const unica of porSlot("peca_unica")) {
    const novo = tentarAdicionar(ESTADO_VAZIO, unica);
    if (novo) corpos.push(novo);
  }
  for (const topo of porSlot("parte_de_cima")) {
    const comTopo = tentarAdicionar(ESTADO_VAZIO, topo);
    if (!comTopo) continue;
    for (const base of porSlot("parte_de_baixo")) {
      const comBase = tentarAdicionar(comTopo, base);
      if (comBase) corpos.push(comBase);
    }
  }

  // 2. Calçado (obrigatório).
  let fila: Estado[] = [];
  for (const corpo of corpos) {
    for (const calcado of porSlot("calcado")) {
      const novo = tentarAdicionar(corpo, calcado);
      if (novo) fila.push(novo);
    }
  }

  // 3. Slots opcionais — cada um expande a fila em "sem" (sempre) e "com
  // essa peça" (uma ramificação por peça compatível), podando cedo.
  let truncado = false;
  for (const slot of SLOTS_OPCIONAIS) {
    const novaFila: Estado[] = [];
    for (const parcial of fila) {
      novaFila.push(parcial);
      for (const peca of porSlot(slot)) {
        const comPeca = tentarAdicionar(parcial, peca);
        if (comPeca) novaFila.push(comPeca);
      }
    }
    if (novaFila.length > teto) {
      truncado = true;
      fila = novaFila.slice(0, teto);
    } else {
      fila = novaFila;
    }
  }

  // 4. Monta os candidatos finais, descartando os que já existem (Look
  // aprovado ou candidato pendente/descartado anterior).
  const vistos = new Set(assinaturasExistentes);
  const candidatos: CandidatoGerado[] = [];
  for (const final of fila) {
    const fingerprint = calcularFingerprint(final.pecasPorSlot);
    if (vistos.has(fingerprint)) continue;
    vistos.add(fingerprint);
    candidatos.push({
      fingerprint,
      pecasPorSlot: final.pecasPorSlot,
      climas: final.climas ?? [],
      ocasioesSugeridas: final.ocasioes ?? [],
      perfisSugeridos: final.perfis ?? [],
    });
  }

  return { candidatos, truncado };
}
