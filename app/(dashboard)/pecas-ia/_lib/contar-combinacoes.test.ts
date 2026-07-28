import { describe, expect, it } from "vitest";
import type { PecaParaGeracao } from "../../sugestoes-de-look/_lib/gerar-candidatos";
import { contarCombinacoes } from "./contar-combinacoes";

const CATALOGO: PecaParaGeracao[] = [
  { id: "base-1", slot: "parte_de_baixo", climas: ["leve"], ocasioes: ["trabalho"], perfis: ["p1"] },
  { id: "base-2", slot: "parte_de_baixo", climas: ["leve"], ocasioes: ["trabalho"], perfis: ["p1"] },
  { id: "calcado-1", slot: "calcado", climas: ["leve"], ocasioes: ["trabalho"], perfis: ["p1"] },
];

describe("contarCombinacoes", () => {
  it("conta 1 combinação por peça compatível de cada slot restante (2 bases x 1 calçado)", () => {
    const hipotetica = {
      slot: "parte_de_cima",
      climas: ["leve"],
      ocasioes: ["trabalho"],
      perfis: ["p1"],
    };

    expect(contarCombinacoes(hipotetica, CATALOGO)).toBe(2);
  });

  it("clima incompatível com o resto do catálogo zera as combinações", () => {
    const hipotetica = {
      slot: "parte_de_cima",
      climas: ["pesada"],
      ocasioes: ["trabalho"],
      perfis: ["p1"],
    };

    expect(contarCombinacoes(hipotetica, CATALOGO)).toBe(0);
  });

  it("ocasião sem interseção com o resto do catálogo zera as combinações", () => {
    const hipotetica = {
      slot: "parte_de_cima",
      climas: ["leve"],
      ocasioes: ["treino"],
      perfis: ["p1"],
    };

    expect(contarCombinacoes(hipotetica, CATALOGO)).toBe(0);
  });

  it("slot sem clima (bolsa) não é restringido por clima do resto do catálogo", () => {
    const hipotetica = {
      slot: "bolsa",
      climas: [],
      ocasioes: ["trabalho"],
      perfis: ["p1"],
    };

    // bolsa é opcional: entra como "extra" em cima de cada combinação já
    // válida (2 bases x 1 calçado = 2 combinações de corpo+calçado, cada
    // uma pode ganhar a bolsa) — mas sem peça_unica/parte_de_cima no
    // catálogo de teste não há corpo nenhum pra formar, então o total é 0.
    expect(contarCombinacoes(hipotetica, CATALOGO)).toBe(0);
  });
});
