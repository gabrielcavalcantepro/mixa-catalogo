import { formatarData } from "../../_lib/formatar-data";

export type PecaComRelacoes = {
  id: string;
  nome: string;
  slot: string;
  corTipo: string;
  corValor: string;
  pecaChave: boolean;
  linkAfiliado: string | null;
  capsula: { id: string; nome: string; dataLancamento: Date };
  imagens: { url: string; ordem: number; isCapa: boolean }[];
  pesosClima: { pesoClima: string }[];
  ocasioesBase: { ocasiao: string }[];
  estilos: { perfilEstilo: { id: string; nome: string } }[];
};

/** Peça (com relations já carregadas pela query) -> formato de resposta da API v1. */
export function mapearPeca(peca: PecaComRelacoes) {
  return {
    id: peca.id,
    nome: peca.nome,
    slot: peca.slot,
    cor: { tipo: peca.corTipo, valor: peca.corValor },
    pecaChave: peca.pecaChave,
    capsula: {
      id: peca.capsula.id,
      nome: peca.capsula.nome,
      dataLancamento: formatarData(peca.capsula.dataLancamento),
    },
    linkAfiliado: peca.linkAfiliado,
    imagens: peca.imagens.map((img) => ({
      url: img.url,
      ordem: img.ordem,
      isCapa: img.isCapa,
    })),
    pesoClima: peca.pesosClima.map((p) => p.pesoClima),
    ocasiaoBase: peca.ocasioesBase.map((o) => o.ocasiao),
    perfilEstilo: peca.estilos.map((e) => ({ id: e.perfilEstilo.id, nome: e.perfilEstilo.nome })),
  };
}
