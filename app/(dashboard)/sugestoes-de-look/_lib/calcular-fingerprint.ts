/**
 * Assinatura determinística de uma combinação de peças por slot —
 * independente da ordem em que os slots foram inseridos no objeto.
 * Usada pra nunca recriar (nem sugerir de novo) uma combinação que já
 * virou Look ou que já foi descartada (ver gerar-candidatos.ts).
 */
export function calcularFingerprint(pecasPorSlot: Record<string, string>): string {
  return Object.entries(pecasPorSlot)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([slot, pecaId]) => `${slot}:${pecaId}`)
    .join("|");
}
