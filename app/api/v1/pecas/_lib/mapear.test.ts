import { describe, expect, it } from "vitest";
import { mapearPeca, type PecaComRelacoes } from "./mapear";

const pecaBase: PecaComRelacoes = {
  id: "peca-1",
  nome: "Camisa linho",
  slot: "parte_de_cima",
  corTipo: "neutra",
  corValor: "Branco",
  pecaChave: true,
  linkAfiliado: null,
  capsula: { id: "cap-1", nome: "Verão 26", dataLancamento: new Date("2026-01-15") },
  imagens: [
    { url: "/uploads/camisa-1.jpg", ordem: 0, isCapa: true },
    { url: "/uploads/camisa-2.jpg", ordem: 1, isCapa: false },
  ],
  pesosClima: [{ pesoClima: "quente" }],
  ocasioesBase: [{ ocasiao: "trabalho" }, { ocasiao: "lazer" }],
  estilos: [
    {
      perfilEstilo: {
        id: "perfil-1",
        nome: "Minimalista",
        descricao: "Peças básicas",
        criadoEm: new Date("2026-01-01"),
      } as unknown as { id: string; nome: string },
    },
  ],
};

describe("mapearPeca", () => {
  it("mapeia todos os campos, inclusive quando linkAfiliado é null", () => {
    const resultado = mapearPeca(pecaBase);

    expect(resultado).toEqual({
      id: "peca-1",
      nome: "Camisa linho",
      slot: "parte_de_cima",
      cor: { tipo: "neutra", valor: "Branco" },
      pecaChave: true,
      capsula: { id: "cap-1", nome: "Verão 26", dataLancamento: "2026-01-15" },
      linkAfiliado: null,
      imagens: [
        { url: "/uploads/camisa-1.jpg", ordem: 0, isCapa: true },
        { url: "/uploads/camisa-2.jpg", ordem: 1, isCapa: false },
      ],
      pesoClima: ["quente"],
      ocasiaoBase: ["trabalho", "lazer"],
      perfilEstilo: [{ id: "perfil-1", nome: "Minimalista" }],
    });
  });

  it("preserva linkAfiliado quando presente, mesmo sem ser link de afiliado de verdade", () => {
    const peca: PecaComRelacoes = { ...pecaBase, linkAfiliado: "https://loja.com/produto" };

    const resultado = mapearPeca(peca);

    expect(resultado.linkAfiliado).toBe("https://loja.com/produto");
  });

  it("mapeia listas vazias de pesoClima/ocasiaoBase (slots sem clima, ex. cinto/bolsa)", () => {
    const peca: PecaComRelacoes = { ...pecaBase, pesosClima: [], ocasioesBase: [] };

    const resultado = mapearPeca(peca);

    expect(resultado.pesoClima).toEqual([]);
    expect(resultado.ocasiaoBase).toEqual([]);
  });
});
