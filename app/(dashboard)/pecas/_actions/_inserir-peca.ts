import { db } from "@/db";
import { pecaEstilo, pecaImagens, pecaOcasiaoBase, pecaPesoClima, pecas, type Peca } from "@/db/schema";
import { storage } from "@/lib/storage";
import type { PecaFormValues } from "../_lib/schema";

/**
 * Helper privado da fatia de peças (não é Server Action própria — sem
 * "use server" aqui, só importado por quem já é). Insere peça +
 * tabelas de junção numa transação, depois sobe as imagens e insere
 * peca_imagem. Reaproveitado por criar-peca.ts (peça única) e
 * confirmar-cadastro-em-massa.ts (cadastro em massa) — mesma regra de
 * criação pros 2 caminhos, mesmo padrão de looks/_actions/_inserir-look.ts.
 */
export async function inserirPeca(dados: PecaFormValues, arquivos: File[]): Promise<Peca> {
  const { pesoClima, perfilEstiloIds, ocasiaoBase, ...dadosPeca } = dados;

  const novaPeca = await db.transaction(async (tx) => {
    const [peca] = await tx.insert(pecas).values(dadosPeca).returning();
    await Promise.all([
      // pesoClima é vazio de propósito nos slots sem clima (cinto/bolsa/
      // acessório-outro) — `.values([])` faz o Drizzle lançar erro, por
      // isso só insere quando há algo pra inserir.
      pesoClima.length > 0
        ? tx.insert(pecaPesoClima).values(pesoClima.map((p) => ({ pecaId: peca.id, pesoClima: p })))
        : Promise.resolve(),
      tx
        .insert(pecaEstilo)
        .values(perfilEstiloIds.map((id) => ({ pecaId: peca.id, perfilEstiloId: id }))),
      tx
        .insert(pecaOcasiaoBase)
        .values(ocasiaoBase.map((o) => ({ pecaId: peca.id, ocasiao: o }))),
    ]);
    return peca;
  });

  const urls = await Promise.all(
    arquivos.map((arquivo) => storage.salvar(arquivo, `pecas/${novaPeca.id}`)),
  );
  await db
    .insert(pecaImagens)
    .values(urls.map((url, ordem) => ({ pecaId: novaPeca.id, url, ordem, isCapa: ordem === 0 })));

  return novaPeca;
}
