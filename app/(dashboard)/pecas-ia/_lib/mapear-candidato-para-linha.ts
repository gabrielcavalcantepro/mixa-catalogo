import { pecaSchema } from "../../pecas/_lib/schema";
import type { LinhaEstado } from "../../pecas/em-massa/_components/linha-revisao";

/**
 * Mapeia um candidato (com relations) pro mesmo formato de linha que a
 * tela de revisão do cadastro em massa já usa — reaproveita
 * `LinhaEstado`/`pecaSchema` de propósito (mesma validação, mesma UI,
 * não duplica nada). `erro` já é calculado aqui com o mesmo
 * `pecaSchema` do form único, pra a linha já chegar com o estado de
 * validação certo antes de qualquer edição do admin.
 */
export function mapearCandidatoParaLinha(candidato: {
  id: string;
  nome: string;
  slot: string;
  corTipo: string;
  corValor: string;
  capsulaId: string | null;
  pecaChave: boolean;
  linkAfiliado: string | null;
  imagemUrl: string | null;
  linkOrigemImagem: string | null;
  numeroCombinacoes: number | null;
  pesosClima: { pesoClima: string }[];
  ocasioesBase: { ocasiao: string }[];
  estilos: { perfilEstiloId: string }[];
}): LinhaEstado {
  const valores = {
    nome: candidato.nome,
    slot: candidato.slot,
    corTipo: candidato.corTipo,
    corValor: candidato.corValor,
    pecaChave: candidato.pecaChave,
    capsulaId: candidato.capsulaId ?? "",
    linkAfiliado: candidato.linkAfiliado,
    pesoClima: candidato.pesosClima.map((p) => p.pesoClima),
    ocasiaoBase: candidato.ocasioesBase.map((o) => o.ocasiao),
    perfilEstiloIds: candidato.estilos.map((e) => e.perfilEstiloId),
  };

  const validado = pecaSchema.safeParse(valores);

  return {
    id: candidato.id,
    origemCandidatoId: candidato.id,
    numeroCombinacoes: candidato.numeroCombinacoes ?? undefined,
    imagemExistente: candidato.imagemUrl
      ? { url: candidato.imagemUrl, linkOrigem: candidato.linkOrigemImagem }
      : null,
    imagens: [],
    valores,
    erro: validado.success ? undefined : validado.error.issues[0].message,
  };
}
