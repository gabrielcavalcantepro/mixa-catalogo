import { db } from "@/db";

export async function buscarLook(id: string) {
  return db.query.looks.findFirst({
    where: (look, { eq }) => eq(look.id, id),
    with: {
      capsula: true,
      varianteDe: true,
      pecas: { with: { peca: { with: { imagens: true } } } },
      ocasioes: true,
      perfisEstilo: { with: { perfilEstilo: true } },
      slotsTrocados: true,
      variantes: true,
      climas: true,
    },
  });
}
