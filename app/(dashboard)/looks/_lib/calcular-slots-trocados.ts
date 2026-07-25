/**
 * Um slot conta como "trocado" numa variante quando a peça daquele slot
 * é diferente do look-base — incluindo os casos em que o slot foi
 * removido ou adicionado em relação ao look-base.
 */
export function calcularSlotsTrocados(
  pecasBase: Record<string, string>,
  pecasVariante: Record<string, string>,
): string[] {
  const todosSlots = new Set([...Object.keys(pecasBase), ...Object.keys(pecasVariante)]);
  return [...todosSlots].filter((slot) => pecasBase[slot] !== pecasVariante[slot]);
}
