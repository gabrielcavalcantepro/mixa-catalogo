import { formatarData } from "../../_lib/formatar-data";

export type LookComRelacoes = {
  id: string;
  nome: string | null;
  climaMisto: boolean;
  capsula: { id: string; nome: string; dataLancamento: Date };
  varianteDe: { id: string; nome: string | null } | null;
  pecas: {
    slot: string;
    peca: {
      id: string;
      nome: string;
      imagens: { url: string; isCapa: boolean }[];
    };
  }[];
  ocasioes: { ocasiao: string }[];
  perfisEstilo: { perfilEstilo: { id: string; nome: string } }[];
  climas: { pesoClima: string }[];
  slotsTrocados: { slot: string }[];
};

/** Look (com relations já carregadas pela query) -> formato de resposta da API v1. */
export function mapearLook(look: LookComRelacoes) {
  return {
    id: look.id,
    nome: look.nome,
    capsula: {
      id: look.capsula.id,
      nome: look.capsula.nome,
      dataLancamento: formatarData(look.capsula.dataLancamento),
    },
    clima: {
      climas: look.climas.map((c) => c.pesoClima),
      misto: look.climaMisto,
    },
    ocasioes: look.ocasioes.map((o) => o.ocasiao),
    perfisEstilo: look.perfisEstilo.map((p) => ({
      id: p.perfilEstilo.id,
      nome: p.perfilEstilo.nome,
    })),
    pecas: look.pecas.map((lp) => ({
      slot: lp.slot,
      peca: {
        id: lp.peca.id,
        nome: lp.peca.nome,
        imagens: lp.peca.imagens.map((img) => ({ url: img.url, isCapa: img.isCapa })),
      },
    })),
    varianteDe: look.varianteDe
      ? { id: look.varianteDe.id, nome: look.varianteDe.nome }
      : null,
    ...(look.varianteDe ? { slotsTrocados: look.slotsTrocados.map((s) => s.slot) } : {}),
  };
}
