/**
 * Cápsula de um look é sempre derivada automaticamente — a mais recente
 * (maior data_lancamento) entre as cápsulas das peças que o compõem.
 * Não é um campo editável manualmente (ver SPEC.md).
 */
export function derivarCapsulaId(
  pecas: { capsulaId: string; dataLancamento: Date }[],
): string {
  if (pecas.length === 0) {
    throw new Error("derivarCapsulaId: é preciso ao menos uma peça.");
  }

  return pecas.reduce((maisRecente, atual) =>
    atual.dataLancamento.getTime() > maisRecente.dataLancamento.getTime() ? atual : maisRecente,
  ).capsulaId;
}
