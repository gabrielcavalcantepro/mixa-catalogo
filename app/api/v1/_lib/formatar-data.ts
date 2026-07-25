/** "AAAA-MM-DD", sem hora/timezone — usado pra colunas `date` (sem hora) nas respostas da API. */
export function formatarData(data: Date): string {
  return data.toISOString().slice(0, 10);
}
