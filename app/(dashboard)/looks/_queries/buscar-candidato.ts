import { db } from "@/db";

/**
 * Consulta local às tabelas `look_candidato*` — mesmo padrão de
 * `opcoes-formulario.ts`, que já lê `peca`/`perfil_estilo` direto sem
 * importar a fatia de sugestoes-de-look.
 */
export async function buscarCandidato(id: string) {
  return db.query.lookCandidatos.findFirst({
    where: (candidato, { eq }) => eq(candidato.id, id),
    with: {
      pecas: { with: { peca: { with: { imagens: true } } } },
      ocasioesSugeridas: true,
      perfisSugeridos: true,
    },
  });
}
