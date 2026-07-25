import { db } from "@/db";

export async function buscarPeca(id: string) {
  return db.query.pecas.findFirst({
    where: (peca, { eq }) => eq(peca.id, id),
    with: {
      imagens: true,
      pesosClima: true,
      estilos: true,
      ocasioesBase: true,
    },
  });
}
