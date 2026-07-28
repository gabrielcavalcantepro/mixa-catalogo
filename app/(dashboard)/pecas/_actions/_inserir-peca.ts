import { db } from "@/db";
import { pecaEstilo, pecaImagens, pecaOcasiaoBase, pecaPesoClima, pecas, type Peca } from "@/db/schema";
import type { PecaFormValues } from "../_lib/schema";

/**
 * Helper privado da fatia de peças (não é Server Action própria — sem
 * "use server" aqui, só importado por quem já é). Insere peça +
 * tabelas de junção numa transação, depois insere peca_imagem com as
 * URLs já hospedadas — reaproveitado por criar-peca.ts (peça única),
 * confirmar-cadastro-em-massa.ts (cadastro em massa, planilha ou
 * busca por IA) — mesma regra de criação pros 3 caminhos, mesmo padrão
 * de looks/_actions/_inserir-look.ts.
 *
 * Recebe `urls` já prontas (não `File[]`) — quem chama decide se
 * precisa subir arquivo novo pro Supabase antes (peça única/planilha)
 * ou se a imagem já está hospedada de antes (candidato aprovado da
 * busca por IA, que já subiu a imagem no momento da busca — reenviar
 * de novo seria upload duplicado). `id` é opcional: quando quem chama
 * precisa saber o id da peça ANTES de existir (pra montar a pasta de
 * upload `pecas/<id>/...`), gera o uuid e passa aqui; sem isso, o
 * banco gera um novo (mesmo comportamento de sempre).
 */
export async function inserirPeca(
  dados: PecaFormValues,
  urls: string[],
  id?: string,
): Promise<Peca> {
  const { pesoClima, perfilEstiloIds, ocasiaoBase, ...dadosPeca } = dados;

  const novaPeca = await db.transaction(async (tx) => {
    const [peca] = await tx
      .insert(pecas)
      .values(id ? { ...dadosPeca, id } : dadosPeca)
      .returning();
    await Promise.all([
      // pesoClima é vazio de propósito nos slots sem clima (cinto/bolsa/
      // acessório-outro) — `.values([])` faz o Drizzle lançar erro, por
      // isso só insere quando há algo pra inserir.
      pesoClima.length > 0
        ? tx.insert(pecaPesoClima).values(pesoClima.map((p) => ({ pecaId: peca.id, pesoClima: p })))
        : Promise.resolve(),
      tx
        .insert(pecaEstilo)
        .values(perfilEstiloIds.map((estiloId) => ({ pecaId: peca.id, perfilEstiloId: estiloId }))),
      tx
        .insert(pecaOcasiaoBase)
        .values(ocasiaoBase.map((o) => ({ pecaId: peca.id, ocasiao: o }))),
    ]);
    return peca;
  });

  if (urls.length > 0) {
    await db
      .insert(pecaImagens)
      .values(urls.map((url, ordem) => ({ pecaId: novaPeca.id, url, ordem, isCapa: ordem === 0 })));
  }

  return novaPeca;
}
