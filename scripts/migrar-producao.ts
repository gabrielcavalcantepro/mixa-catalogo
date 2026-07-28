import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../db/schema";
import {
  capsulas,
  perfisEstilo,
  pecas,
  pecaImagens,
  pecaPesoClima,
  pecaEstilo,
  pecaOcasiaoBase,
  looks,
  lookPecas,
  lookOcasioes,
  lookPerfisEstilo,
  lookSlotsTrocados,
  lookClimas,
  lookCandidatos,
  lookCandidatoPecas,
  lookCandidatoClimas,
  lookCandidatoOcasioesSugeridas,
  lookCandidatoPerfisSugeridos,
  slotEnum,
  ocasiaoEnum,
  pesoClimaEnum,
  type Peca,
  type Look,
  type LookCandidato,
} from "../db/schema";

type Slot = (typeof slotEnum.enumValues)[number];
type Ocasiao = (typeof ocasiaoEnum.enumValues)[number];
type PesoClima = (typeof pesoClimaEnum.enumValues)[number];

/**
 * Migração pontual: 1º lote de dados reais (peça, look, look_candidato)
 * do Postgres local pro de produção. As imagens já foram migradas pro
 * Supabase Storage antes (scripts/migrar-imagens-storage.ts) — a URL
 * em peca_imagem.url é copiada como está, sem tradução (bucket público
 * único, mesmo em dev e produção).
 *
 * Cápsula e perfil de estilo têm o mesmo `nome` mas `id` diferente
 * entre local e produção (cada `db:seed` gerou UUIDs próprios) — por
 * isso toda referência a eles é resolvida por nome, nunca copiando o
 * id local. Peça também é resolvida por nome pra decidir se já existe
 * em produção, mas os ids de peça/look/look_candidato recém-inseridos
 * são reaproveitados do local (simplifica as tabelas filhas). Dry-run
 * por padrão; só escreve com `--confirmar`.
 */

function agruparPor<T>(linhas: T[], obterChave: (linha: T) => string): Map<string, T[]> {
  const mapa = new Map<string, T[]>();
  for (const linha of linhas) {
    const chave = obterChave(linha);
    const lista = mapa.get(chave);
    if (lista) lista.push(linha);
    else mapa.set(chave, [linha]);
  }
  return mapa;
}

/**
 * `relaxarSsl` desliga a verificação da cadeia de certificado (mas
 * mantém a conexão criptografada) — necessário pro pooler de produção
 * (certificado autoassinado), do jeito que `psql` já se comporta por
 * padrão com `sslmode=require`. Nunca usar isso pro banco local (sem
 * TLS nenhum — passar `ssl` quebraria a conexão).
 *
 * `pg-connection-string` recente trata `sslmode=require` na própria
 * connection string como alias de `verify-full` e isso tem prioridade
 * sobre o `ssl` explícito do config — por isso remove o `sslmode` da
 * URL antes de passar pro `Pool`, deixando só o `ssl` abaixo decidir.
 */
/**
 * Remove só o parâmetro `sslmode` da query string, sem reconstruir a
 * URL inteira via `new URL()` — evitar isso é de propósito: um
 * round-trip completo por `URL` pode reescrever/reescapar a parte
 * `user:senha@host:porta`, e como não vemos o valor real da connection
 * string aqui, não há como conferir que isso ficou incólume. Tratando
 * só a query string (que `URLSearchParams` entende sozinha, sem noção
 * de esquema), o resto da string não é tocado.
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

function criarConexao(url: string, opcoes?: { relaxarSsl?: boolean }) {
  const connectionString = opcoes?.relaxarSsl ? removerSslModeDaConnectionString(url) : url;
  const pool = new Pool({
    connectionString,
    ssl: opcoes?.relaxarSsl ? { rejectUnauthorized: false } : undefined,
  });
  return drizzle(pool, { schema });
}

type Resolucao = { id: string } | { erro: string };

function ordenarLooksPorDependenciaDeVariante(looksLocal: Look[]): Look[] {
  const restantes = [...looksLocal];
  const ordenados: Look[] = [];
  const idsProntos = new Set<string>();
  while (restantes.length > 0) {
    const indice = restantes.findIndex(
      (l) => !l.varianteDeId || idsProntos.has(l.varianteDeId),
    );
    if (indice === -1) {
      throw new Error(
        "Ciclo ou base ausente na cadeia de variante_de_id — não deveria acontecer com dado da aplicação.",
      );
    }
    const [look] = restantes.splice(indice, 1);
    idsProntos.add(look.id);
    ordenados.push(look);
  }
  return ordenados;
}

async function main() {
  const confirmar = process.argv.includes("--confirmar");

  const localUrl = process.env.DATABASE_URL;
  const prodUrl = process.env.PROD_DATABASE_URL;
  if (!localUrl) throw new Error("DATABASE_URL não configurada.");
  if (!prodUrl) throw new Error("PROD_DATABASE_URL não configurada no ambiente.");
  if (prodUrl === localUrl) {
    throw new Error("PROD_DATABASE_URL é igual a DATABASE_URL — origem e destino não podem ser o mesmo banco.");
  }

  const dbLocal = criarConexao(localUrl);
  const dbProd = criarConexao(prodUrl, { relaxarSsl: true });

  // --- mapas de referência: cápsula e perfil de estilo, resolvidos por nome ---
  const capsulasProd = await dbProd.select({ id: capsulas.id, nome: capsulas.nome }).from(capsulas);
  const capsulaIdPorNomeProd = new Map(capsulasProd.map((c) => [c.nome, c.id]));

  const perfisProd = await dbProd
    .select({ id: perfisEstilo.id, nome: perfisEstilo.nome })
    .from(perfisEstilo);
  const perfilIdPorNomeProd = new Map(perfisProd.map((p) => [p.nome, p.id]));

  const capsulasLocal = await dbLocal.select({ id: capsulas.id, nome: capsulas.nome }).from(capsulas);
  const nomeCapsulaPorIdLocal = new Map(capsulasLocal.map((c) => [c.id, c.nome]));

  const perfisLocal = await dbLocal
    .select({ id: perfisEstilo.id, nome: perfisEstilo.nome })
    .from(perfisEstilo);
  const nomePerfilPorIdLocal = new Map(perfisLocal.map((p) => [p.id, p.nome]));

  function resolverCapsulaId(idLocal: string): Resolucao {
    const nome = nomeCapsulaPorIdLocal.get(idLocal);
    if (!nome) return { erro: `cápsula local ${idLocal} não encontrada` };
    const id = capsulaIdPorNomeProd.get(nome);
    if (!id) return { erro: `cápsula "${nome}" não existe em produção` };
    return { id };
  }

  function resolverPerfilId(idLocal: string): Resolucao {
    const nome = nomePerfilPorIdLocal.get(idLocal);
    if (!nome) return { erro: `perfil de estilo local ${idLocal} não encontrado` };
    const id = perfilIdPorNomeProd.get(nome);
    if (!id) return { erro: `perfil de estilo "${nome}" não existe em produção` };
    return { id };
  }

  // ============================= PEÇAS =============================
  const pecasLocal = await dbLocal.select().from(pecas);
  const pecasProdExistentes = await dbProd.select({ id: pecas.id, nome: pecas.nome }).from(pecas);
  const pecaIdProdPorNome = new Map(pecasProdExistentes.map((p) => [p.nome, p.id]));

  const imagensLocal = agruparPor(await dbLocal.select().from(pecaImagens), (i) => i.pecaId);
  const pesoClimaLocal = agruparPor(await dbLocal.select().from(pecaPesoClima), (p) => p.pecaId);
  const estiloLocal = agruparPor(await dbLocal.select().from(pecaEstilo), (e) => e.pecaId);
  const ocasiaoBaseLocal = agruparPor(await dbLocal.select().from(pecaOcasiaoBase), (o) => o.pecaId);

  const pecaIdMap = new Map<string, string>(); // idLocal -> idProdução
  const pecasAMigrar: { peca: Peca; capsulaId: string }[] = [];
  const pecasBloqueadas: { peca: Peca; motivo: string }[] = [];
  let pecasJaExistentes = 0;

  for (const peca of pecasLocal) {
    const idExistente = pecaIdProdPorNome.get(peca.nome);
    if (idExistente) {
      pecaIdMap.set(peca.id, idExistente);
      pecasJaExistentes++;
      continue;
    }

    const capsula = resolverCapsulaId(peca.capsulaId);
    if ("erro" in capsula) {
      pecasBloqueadas.push({ peca, motivo: capsula.erro });
      continue;
    }
    const perfisInvalidos = (estiloLocal.get(peca.id) ?? [])
      .map((e) => resolverPerfilId(e.perfilEstiloId))
      .filter((r): r is { erro: string } => "erro" in r);
    if (perfisInvalidos.length > 0) {
      pecasBloqueadas.push({ peca, motivo: perfisInvalidos[0].erro });
      continue;
    }

    pecaIdMap.set(peca.id, peca.id);
    pecasAMigrar.push({ peca, capsulaId: capsula.id });
  }

  // ============================= LOOKS =============================
  const looksLocalOrdenados = ordenarLooksPorDependenciaDeVariante(await dbLocal.select().from(looks));
  const looksProdIds = new Set((await dbProd.select({ id: looks.id }).from(looks)).map((l) => l.id));

  const lookPecasLocal = agruparPor(await dbLocal.select().from(lookPecas), (l) => l.lookId);
  const lookOcasioesLocal = agruparPor(await dbLocal.select().from(lookOcasioes), (l) => l.lookId);
  const lookPerfisLocal = agruparPor(await dbLocal.select().from(lookPerfisEstilo), (l) => l.lookId);
  const lookSlotsTrocadosLocal = agruparPor(await dbLocal.select().from(lookSlotsTrocados), (l) => l.lookId);
  const lookClimasLocal = agruparPor(await dbLocal.select().from(lookClimas), (l) => l.lookId);

  const looksAMigrar: {
    look: Look;
    capsulaId: string;
    pecas: { slot: Slot; pecaId: string }[];
    ocasioes: { ocasiao: Ocasiao }[];
    perfis: { perfilEstiloId: string }[];
    slotsTrocados: { slot: Slot }[];
    climas: { pesoClima: PesoClima }[];
  }[] = [];
  const looksBloqueados: { look: Look; motivo: string }[] = [];
  let looksJaExistentes = 0;
  const looksProntosNestaRodada = new Set<string>();

  for (const look of looksLocalOrdenados) {
    if (looksProdIds.has(look.id)) {
      looksJaExistentes++;
      looksProntosNestaRodada.add(look.id);
      continue;
    }

    const capsula = resolverCapsulaId(look.capsulaId);
    if ("erro" in capsula) {
      looksBloqueados.push({ look, motivo: capsula.erro });
      continue;
    }
    if (look.varianteDeId && !looksProntosNestaRodada.has(look.varianteDeId)) {
      looksBloqueados.push({
        look,
        motivo: `look-base ${look.varianteDeId} não está em produção nem migrado nesta rodada`,
      });
      continue;
    }

    let erro: string | undefined;
    const pecasResolvidas = (lookPecasLocal.get(look.id) ?? []).map((lp) => {
      const pecaIdProd = pecaIdMap.get(lp.pecaId);
      if (!pecaIdProd) erro = `peça ${lp.pecaId} (slot ${lp.slot}) não está mapeada`;
      return { slot: lp.slot, pecaId: pecaIdProd ?? lp.pecaId };
    });
    const perfisResolvidos = (lookPerfisLocal.get(look.id) ?? []).map((lpe) => {
      const r = resolverPerfilId(lpe.perfilEstiloId);
      if ("erro" in r) erro = r.erro;
      return { perfilEstiloId: "erro" in r ? lpe.perfilEstiloId : r.id };
    });
    if (erro) {
      looksBloqueados.push({ look, motivo: erro });
      continue;
    }

    looksProntosNestaRodada.add(look.id);
    looksAMigrar.push({
      look,
      capsulaId: capsula.id,
      pecas: pecasResolvidas,
      ocasioes: (lookOcasioesLocal.get(look.id) ?? []).map((o) => ({ ocasiao: o.ocasiao })),
      perfis: perfisResolvidos,
      slotsTrocados: (lookSlotsTrocadosLocal.get(look.id) ?? []).map((s) => ({ slot: s.slot })),
      climas: (lookClimasLocal.get(look.id) ?? []).map((c) => ({ pesoClima: c.pesoClima })),
    });
  }

  // ======================= LOOK CANDIDATOS ==========================
  const candidatosLocal = await dbLocal.select().from(lookCandidatos);
  const candidatosProdFingerprints = new Set(
    (await dbProd.select({ fingerprint: lookCandidatos.fingerprint }).from(lookCandidatos)).map(
      (c) => c.fingerprint,
    ),
  );

  const candPecasLocal = agruparPor(await dbLocal.select().from(lookCandidatoPecas), (c) => c.candidatoId);
  const candClimasLocal = agruparPor(await dbLocal.select().from(lookCandidatoClimas), (c) => c.candidatoId);
  const candOcasioesLocal = agruparPor(
    await dbLocal.select().from(lookCandidatoOcasioesSugeridas),
    (c) => c.candidatoId,
  );
  const candPerfisLocal = agruparPor(
    await dbLocal.select().from(lookCandidatoPerfisSugeridos),
    (c) => c.candidatoId,
  );

  const candidatosAMigrar: {
    candidato: LookCandidato;
    pecas: { slot: Slot; pecaId: string }[];
    climas: { pesoClima: PesoClima }[];
    ocasioes: { ocasiao: Ocasiao }[];
    perfis: { perfilEstiloId: string }[];
  }[] = [];
  const candidatosBloqueados: { candidato: LookCandidato; motivo: string }[] = [];
  let candidatosJaExistentes = 0;

  for (const candidato of candidatosLocal) {
    if (candidatosProdFingerprints.has(candidato.fingerprint)) {
      candidatosJaExistentes++;
      continue;
    }

    let erro: string | undefined;
    const pecasResolvidas = (candPecasLocal.get(candidato.id) ?? []).map((cp) => {
      const pecaIdProd = pecaIdMap.get(cp.pecaId);
      if (!pecaIdProd) erro = `peça ${cp.pecaId} (slot ${cp.slot}) não está mapeada`;
      return { slot: cp.slot, pecaId: pecaIdProd ?? cp.pecaId };
    });
    const perfisResolvidos = (candPerfisLocal.get(candidato.id) ?? []).map((cp) => {
      const r = resolverPerfilId(cp.perfilEstiloId);
      if ("erro" in r) erro = r.erro;
      return { perfilEstiloId: "erro" in r ? cp.perfilEstiloId : r.id };
    });
    if (erro) {
      candidatosBloqueados.push({ candidato, motivo: erro });
      continue;
    }

    candidatosAMigrar.push({
      candidato,
      pecas: pecasResolvidas,
      climas: (candClimasLocal.get(candidato.id) ?? []).map((c) => ({ pesoClima: c.pesoClima })),
      ocasioes: (candOcasioesLocal.get(candidato.id) ?? []).map((o) => ({ ocasiao: o.ocasiao })),
      perfis: perfisResolvidos,
    });
  }

  // ============================ RELATÓRIO ============================
  console.log("=== Peças ===");
  console.log(
    `${pecasAMigrar.length} a migrar, ${pecasJaExistentes} já existem, ${pecasBloqueadas.length} bloqueada(s)`,
  );
  for (const { peca } of pecasAMigrar) console.log(`  + ${peca.nome} (${peca.id})`);
  for (const { peca, motivo } of pecasBloqueadas) {
    console.log(`  ! BLOQUEADA ${peca.nome} (${peca.id}): ${motivo}`);
  }

  console.log("\n=== Looks ===");
  console.log(
    `${looksAMigrar.length} a migrar, ${looksJaExistentes} já existem, ${looksBloqueados.length} bloqueado(s)`,
  );
  for (const { look } of looksAMigrar) console.log(`  + ${look.nome ?? "(sem nome)"} (${look.id})`);
  for (const { look, motivo } of looksBloqueados) {
    console.log(`  ! BLOQUEADO ${look.nome ?? "(sem nome)"} (${look.id}): ${motivo}`);
  }

  console.log("\n=== Candidatos de look ===");
  console.log(
    `${candidatosAMigrar.length} a migrar, ${candidatosJaExistentes} já existem, ${candidatosBloqueados.length} bloqueado(s)`,
  );
  for (const { candidato } of candidatosAMigrar) {
    console.log(`  + ${candidato.fingerprint.slice(0, 12)}... [${candidato.status}] (${candidato.id})`);
  }
  for (const { candidato, motivo } of candidatosBloqueados) {
    console.log(`  ! BLOQUEADO ${candidato.id}: ${motivo}`);
  }

  const totalBloqueios = pecasBloqueadas.length + looksBloqueados.length + candidatosBloqueados.length;

  if (!confirmar) {
    console.log("\nDry-run (nada foi alterado). Rode de novo com --confirmar pra migrar de verdade.");
    if (totalBloqueios > 0) process.exitCode = 1;
    return;
  }

  const totalAMigrar = pecasAMigrar.length + looksAMigrar.length + candidatosAMigrar.length;
  if (totalAMigrar === 0) {
    console.log("\nNada a migrar.");
    if (totalBloqueios > 0) process.exitCode = 1;
    return;
  }

  console.log("\nMigrando (uma única transação em produção)...");
  await dbProd.transaction(async (tx) => {
    for (const { peca, capsulaId } of pecasAMigrar) {
      await tx.insert(pecas).values({ ...peca, capsulaId });

      const imagens = imagensLocal.get(peca.id) ?? [];
      if (imagens.length > 0) {
        await tx.insert(pecaImagens).values(
          imagens.map((img) => ({
            pecaId: img.pecaId,
            url: img.url,
            ordem: img.ordem,
            isCapa: img.isCapa,
          })),
        );
      }
      const pesos = pesoClimaLocal.get(peca.id) ?? [];
      if (pesos.length > 0) await tx.insert(pecaPesoClima).values(pesos);

      for (const e of estiloLocal.get(peca.id) ?? []) {
        const perfil = resolverPerfilId(e.perfilEstiloId);
        if ("erro" in perfil) throw new Error(perfil.erro);
        await tx.insert(pecaEstilo).values({ pecaId: peca.id, perfilEstiloId: perfil.id });
      }
      const ocasioes = ocasiaoBaseLocal.get(peca.id) ?? [];
      if (ocasioes.length > 0) await tx.insert(pecaOcasiaoBase).values(ocasioes);
    }

    for (const item of looksAMigrar) {
      await tx.insert(looks).values({ ...item.look, capsulaId: item.capsulaId });
      if (item.pecas.length > 0) {
        await tx
          .insert(lookPecas)
          .values(item.pecas.map((p) => ({ lookId: item.look.id, slot: p.slot, pecaId: p.pecaId })));
      }
      if (item.ocasioes.length > 0) {
        await tx
          .insert(lookOcasioes)
          .values(item.ocasioes.map((o) => ({ lookId: item.look.id, ocasiao: o.ocasiao })));
      }
      if (item.perfis.length > 0) {
        await tx
          .insert(lookPerfisEstilo)
          .values(item.perfis.map((p) => ({ lookId: item.look.id, perfilEstiloId: p.perfilEstiloId })));
      }
      if (item.slotsTrocados.length > 0) {
        await tx
          .insert(lookSlotsTrocados)
          .values(item.slotsTrocados.map((s) => ({ lookId: item.look.id, slot: s.slot })));
      }
      if (item.climas.length > 0) {
        await tx
          .insert(lookClimas)
          .values(item.climas.map((c) => ({ lookId: item.look.id, pesoClima: c.pesoClima })));
      }
    }

    for (const item of candidatosAMigrar) {
      await tx.insert(lookCandidatos).values(item.candidato);
      if (item.pecas.length > 0) {
        await tx
          .insert(lookCandidatoPecas)
          .values(item.pecas.map((p) => ({ candidatoId: item.candidato.id, slot: p.slot, pecaId: p.pecaId })));
      }
      if (item.climas.length > 0) {
        await tx
          .insert(lookCandidatoClimas)
          .values(item.climas.map((c) => ({ candidatoId: item.candidato.id, pesoClima: c.pesoClima })));
      }
      if (item.ocasioes.length > 0) {
        await tx
          .insert(lookCandidatoOcasioesSugeridas)
          .values(item.ocasioes.map((o) => ({ candidatoId: item.candidato.id, ocasiao: o.ocasiao })));
      }
      if (item.perfis.length > 0) {
        await tx
          .insert(lookCandidatoPerfisSugeridos)
          .values(
            item.perfis.map((p) => ({ candidatoId: item.candidato.id, perfilEstiloId: p.perfilEstiloId })),
          );
      }
    }
  });

  console.log(
    `\nMigrado: ${pecasAMigrar.length} peça(s), ${looksAMigrar.length} look(s), ${candidatosAMigrar.length} candidato(s).`,
  );
  if (totalBloqueios > 0) {
    console.log(`${totalBloqueios} item(ns) bloqueado(s) e NÃO migrado(s) — ver detalhes acima.`);
    process.exitCode = 1;
  }
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => {
    process.exit();
  });
