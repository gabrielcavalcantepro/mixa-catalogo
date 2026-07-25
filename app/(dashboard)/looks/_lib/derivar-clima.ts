/**
 * Só esses slots têm clima — duplicado de pecas/_lib/schema.ts de
 * propósito (cada fatia fica autocontida, ver plano de arquitetura).
 */
const SLOTS_COM_CLIMA = ["parte_de_cima", "parte_de_baixo", "peca_unica", "calcado"] as const;

/**
 * Clima de um look é derivado — interseção dos climas das peças que têm
 * clima definido (ignora cinto/bolsa/acessório-outro, que não têm).
 * Filtra por slot, não por "a peça tem alguma linha de peso_clima", pra
 * ficar correto mesmo com dado antigo (peças de slot sem clima que por
 * engano tenham ganhado linhas de clima antes da regra existir).
 *
 * Interseção vazia com peças relevantes presentes = "clima misto" (não
 * bloqueia a criação do look, só sinaliza pro curador). Nenhuma peça
 * relevante presente = não é misto, simplesmente não há clima a derivar.
 */
export function derivarClimaLook(
  pecas: { slot: string; climas: string[] }[],
): { climas: string[]; misto: boolean } {
  const relevantes = pecas.filter((p) =>
    SLOTS_COM_CLIMA.includes(p.slot as (typeof SLOTS_COM_CLIMA)[number]),
  );
  if (relevantes.length === 0) {
    return { climas: [], misto: false };
  }

  const intersecao = relevantes.reduce(
    (acc, p) => acc.filter((c) => p.climas.includes(c)),
    relevantes[0].climas,
  );

  return { climas: intersecao, misto: intersecao.length === 0 };
}
