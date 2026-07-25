import { db } from "@/db";

/** Referência só pro seletor "é variante de" na revisão de candidato. */
export async function listarLooksExistentes() {
  const looks = await db.query.looks.findMany({
    orderBy: (look, { desc }) => [desc(look.criadoEm)],
    with: {
      pecas: { with: { peca: { with: { imagens: true } } } },
    },
  });

  return looks.map((look) => ({
    id: look.id,
    nome: look.nome,
    capas: look.pecas
      .map((lp) => lp.peca.imagens.find((img) => img.isCapa) ?? lp.peca.imagens[0])
      .filter((img): img is NonNullable<typeof img> => !!img)
      .slice(0, 2)
      .map((img) => img.url),
  }));
}
