import {
  gerarCandidatos,
  type PecaParaGeracao,
} from "../../sugestoes-de-look/_lib/gerar-candidatos";

/**
 * Exceção deliberada à regra de fatia autocontida (importa de
 * `sugestoes-de-look`, não duplica): `gerarCandidatos` já é a lógica
 * de combinação testada do motor de sugestão de look, com poda de
 * clima/ocasião — duplicar isso aqui arriscaria as 2 cópias divergirem
 * com o tempo. Decisão do plano aprovado desta funcionalidade.
 *
 * Conta quantas combinações válidas uma peça hipotética (ainda não no
 * catálogo) geraria se já estivesse lá — usado pra decidir se um
 * candidato da busca por IA é versátil o bastante pra entrar na fila
 * de revisão. Só soma 1 peça hipotética à lista real e conta em
 * quantos `candidatos` resultantes o id dela aparece; não grava nada.
 * Assinaturas existentes vêm sempre vazias de propósito — queremos
 * toda combinação válida que a peça permite, não só as inéditas.
 */
export function contarCombinacoes(
  pecaHipotetica: Omit<PecaParaGeracao, "id">,
  catalogoReal: PecaParaGeracao[],
): number {
  const ID_HIPOTETICO = "__hipotetica__";
  const { candidatos } = gerarCandidatos(
    [...catalogoReal, { ...pecaHipotetica, id: ID_HIPOTETICO }],
    [],
  );
  return candidatos.filter((c) => Object.values(c.pecasPorSlot).includes(ID_HIPOTETICO)).length;
}
