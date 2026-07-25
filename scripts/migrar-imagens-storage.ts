import { readFile } from "fs/promises";
import path from "path";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { pecaImagens, pecas } from "../db/schema";
import { storage } from "../lib/storage";

/**
 * Migração pontual: peças cadastradas antes da troca pro Supabase
 * Storage (2026-07-24) ainda têm `peca_imagem.url` apontando pro disco
 * local. Dry-run por padrão; só escreve com `--confirmar`.
 */

const EXTENSAO_PARA_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

function ehUrlLocal(url: string): boolean {
  return url.startsWith("/uploads/");
}

async function main() {
  const confirmar = process.argv.includes("--confirmar");

  const imagens = await db
    .select({
      imagemId: pecaImagens.id,
      pecaId: pecaImagens.pecaId,
      pecaNome: pecas.nome,
      url: pecaImagens.url,
    })
    .from(pecaImagens)
    .innerJoin(pecas, eq(pecaImagens.pecaId, pecas.id));

  const pendentes = imagens.filter((img) => ehUrlLocal(img.url));

  if (pendentes.length === 0) {
    console.log("Nenhuma imagem apontando pro disco local. Nada a fazer.");
    return;
  }

  const totalPecas = new Set(pendentes.map((img) => img.pecaId)).size;
  console.log(`${pendentes.length} imagem(ns) em ${totalPecas} peça(s) apontando pro disco local:`);
  for (const img of pendentes) {
    console.log(`  - ${img.pecaNome} (peça ${img.pecaId}) · imagem ${img.imagemId} · ${img.url}`);
  }

  if (!confirmar) {
    console.log(
      "\nDry-run (nada foi alterado). Rode de novo com --confirmar pra migrar de verdade.",
    );
    return;
  }

  console.log("\nMigrando...");
  let sucesso = 0;
  let falhas = 0;
  for (const img of pendentes) {
    try {
      const caminhoLocal = path.join(process.cwd(), "public", img.url);
      const buffer = await readFile(caminhoLocal);
      const nomeArquivo = path.basename(img.url);
      const extensao = path.extname(nomeArquivo).toLowerCase();
      const arquivo = new File([new Uint8Array(buffer)], nomeArquivo, {
        type: EXTENSAO_PARA_MIME[extensao],
      });

      const novaUrl = await storage.salvar(arquivo, `pecas/${img.pecaId}`);
      await db.update(pecaImagens).set({ url: novaUrl }).where(eq(pecaImagens.id, img.imagemId));

      console.log(`  ok: ${img.url} -> ${novaUrl}`);
      sucesso++;
    } catch (erro) {
      console.error(`  falhou: ${img.url} ->`, erro);
      falhas++;
    }
  }

  console.log(`\n${sucesso} imagem(ns) migrada(s), ${falhas} falha(s).`);
  if (falhas > 0) {
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
