import { inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../db/schema";
import { perfisEstilo, pecas, looks, lookPecas, lookCandidatos, lookCandidatoPecas } from "../db/schema";

/**
 * Migração pontual (produção): mesma limpeza da Parte 1 já aplicada
 * local — troca os 4 perfis de estilo antigos pelos 7 novos fixos, e
 * apaga as 10 peças de teste (e o que depende delas: `look_candidato`
 * E `look` de verdade — em produção existem 6 looks reais, aprovados
 * manualmente pelo usuário pra testar a integração catálogo↔app antes
 * de existir conteúdo de verdade, todos montados só com as peças de
 * teste — confirmado com o usuário antes de incluir isso aqui). Não
 * roda `db:seed` inteiro pra não recriar a conta founder que já existe
 * em produção. Dry-run por padrão; só escreve com `--confirmar`.
 * Identifica tudo por `nome` (não por id) — seguro rodar de novo: o
 * que já foi apagado/inserido simplesmente não aparece mais no que
 * falta fazer.
 */

const NOMES_PERFIS_ANTIGOS = [
  "Clássica",
  "Descontraída/casual-chic",
  "Moderna/minimalista",
  "Romântica",
];

const NOMES_PERFIS_NOVOS = [
  "Esportivo",
  "Tradicional",
  "Elegante",
  "Romântico",
  "Criativo",
  "Sexy",
  "Dramático urbano",
];

const NOMES_PECAS_TESTE = [
  "Blazer preto",
  "Cinto fino preto",
  "Bolsa estruturada preta",
  "Blusa branca alfaiataria",
  "Camiseta preta básica",
  "Calça alfaiataria preta",
  "Legging preta",
  "Vestido preto midi",
  "Sapato social preto",
  "Tênis branco",
];

/**
 * Remove só o parâmetro `sslmode` da query string (sem reconstruir a
 * URL inteira via `new URL()`, que poderia reescrever a parte
 * `user:senha@host:porta`) — o pooler de produção usa certificado
 * autoassinado, então `sslmode=require` no driver Node vira
 * verificação completa e falha; a verificação é desligada explicitamente
 * abaixo em vez disso (mesma solução do scripts/migrar-producao.ts).
 */
function removerSslModeDaConnectionString(url: string): string {
  const indiceQuery = url.indexOf("?");
  if (indiceQuery === -1) return url;
  const base = url.slice(0, indiceQuery);
  const query = new URLSearchParams(url.slice(indiceQuery + 1));
  query.delete("sslmode");
  const queryString = query.toString();
  return queryString ? `${base}?${queryString}` : base;
}

function criarConexaoProd(url: string) {
  const pool = new Pool({
    connectionString: removerSslModeDaConnectionString(url),
    ssl: { rejectUnauthorized: false },
  });
  return drizzle(pool, { schema });
}

async function main() {
  const confirmar = process.argv.includes("--confirmar");

  const prodUrl = process.env.PROD_DATABASE_URL;
  if (!prodUrl) throw new Error("PROD_DATABASE_URL não configurada no ambiente.");

  const db = criarConexaoProd(prodUrl);

  const pecasTeste = await db.select().from(pecas).where(inArray(pecas.nome, NOMES_PECAS_TESTE));
  const idsPecasTeste = pecasTeste.map((p) => p.id);

  let candidatosAApagar: { id: string; fingerprint: string }[] = [];
  let looksAApagar: { id: string; nome: string | null }[] = [];
  if (idsPecasTeste.length > 0) {
    const candidatoIds = await db
      .selectDistinct({ id: lookCandidatoPecas.candidatoId })
      .from(lookCandidatoPecas)
      .where(inArray(lookCandidatoPecas.pecaId, idsPecasTeste));
    if (candidatoIds.length > 0) {
      candidatosAApagar = await db
        .select({ id: lookCandidatos.id, fingerprint: lookCandidatos.fingerprint })
        .from(lookCandidatos)
        .where(inArray(lookCandidatos.id, candidatoIds.map((c) => c.id)));
    }

    const lookIds = await db
      .selectDistinct({ id: lookPecas.lookId })
      .from(lookPecas)
      .where(inArray(lookPecas.pecaId, idsPecasTeste));
    if (lookIds.length > 0) {
      looksAApagar = await db
        .select({ id: looks.id, nome: looks.nome })
        .from(looks)
        .where(inArray(looks.id, lookIds.map((l) => l.id)));
    }
  }

  const perfisAntigos = await db
    .select()
    .from(perfisEstilo)
    .where(inArray(perfisEstilo.nome, NOMES_PERFIS_ANTIGOS));

  const perfisNovosExistentes = await db
    .select({ nome: perfisEstilo.nome })
    .from(perfisEstilo)
    .where(inArray(perfisEstilo.nome, NOMES_PERFIS_NOVOS));
  const nomesNovosExistentes = new Set(perfisNovosExistentes.map((p) => p.nome));
  const perfisNovosAInserir = NOMES_PERFIS_NOVOS.filter((n) => !nomesNovosExistentes.has(n));

  console.log("=== Peças de teste ===");
  console.log(`${pecasTeste.length} a apagar (de ${NOMES_PECAS_TESTE.length} esperadas)`);
  for (const p of pecasTeste) console.log(`  - ${p.nome} (${p.id})`);

  console.log("\n=== Candidatos de look dependentes ===");
  console.log(`${candidatosAApagar.length} a apagar`);
  for (const c of candidatosAApagar) {
    console.log(`  - ${c.fingerprint.slice(0, 12)}... (${c.id})`);
  }

  console.log("\n=== Looks dependentes ===");
  console.log(`${looksAApagar.length} a apagar`);
  for (const l of looksAApagar) {
    console.log(`  - ${l.nome ?? "(sem nome)"} (${l.id})`);
  }

  console.log("\n=== Perfis de estilo antigos ===");
  console.log(`${perfisAntigos.length} a apagar`);
  for (const p of perfisAntigos) console.log(`  - ${p.nome} (${p.id})`);

  console.log("\n=== Perfis de estilo novos ===");
  console.log(
    `${NOMES_PERFIS_NOVOS.length - perfisNovosAInserir.length} já existem, ${perfisNovosAInserir.length} a inserir`,
  );
  for (const n of perfisNovosAInserir) console.log(`  + ${n}`);

  if (!confirmar) {
    console.log("\nDry-run (nada foi alterado). Rode de novo com --confirmar pra aplicar de verdade.");
    return;
  }

  console.log("\nAplicando (uma única transação)...");
  await db.transaction(async (tx) => {
    if (candidatosAApagar.length > 0) {
      await tx.delete(lookCandidatos).where(
        inArray(lookCandidatos.id, candidatosAApagar.map((c) => c.id)),
      );
    }
    if (looksAApagar.length > 0) {
      await tx.delete(looks).where(inArray(looks.id, looksAApagar.map((l) => l.id)));
    }
    if (idsPecasTeste.length > 0) {
      await tx.delete(pecas).where(inArray(pecas.id, idsPecasTeste));
    }
    if (perfisAntigos.length > 0) {
      await tx.delete(perfisEstilo).where(
        inArray(perfisEstilo.id, perfisAntigos.map((p) => p.id)),
      );
    }
    if (perfisNovosAInserir.length > 0) {
      await tx
        .insert(perfisEstilo)
        .values(perfisNovosAInserir.map((nome) => ({ nome })))
        .onConflictDoNothing({ target: perfisEstilo.nome });
    }
  });

  console.log(
    `\nOk: ${idsPecasTeste.length} peça(s), ${looksAApagar.length} look(s), ${candidatosAApagar.length} candidato(s) e ${perfisAntigos.length} perfil(is) antigo(s) apagados; ${perfisNovosAInserir.length} perfil(is) novo(s) inserido(s).`,
  );
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => {
    process.exit();
  });
