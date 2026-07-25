import { describe, expect, it } from "vitest";
import { derivarClimaLook } from "./derivar-clima";

describe("derivarClimaLook", () => {
  it("interseção normal entre peças compatíveis", () => {
    const resultado = derivarClimaLook([
      { slot: "parte_de_cima", climas: ["leve", "meia_estacao"] },
      { slot: "parte_de_baixo", climas: ["meia_estacao", "pesada"] },
    ]);

    expect(resultado).toEqual({ climas: ["meia_estacao"], misto: false });
  });

  it("marca clima misto quando não há interseção", () => {
    const resultado = derivarClimaLook([
      { slot: "parte_de_cima", climas: ["leve"] },
      { slot: "calcado", climas: ["pesada"] },
    ]);

    expect(resultado).toEqual({ climas: [], misto: true });
  });

  it("ignora peças de slot sem clima (cinto/bolsa/acessório-outro)", () => {
    const resultado = derivarClimaLook([
      { slot: "parte_de_cima", climas: ["leve"] },
      { slot: "cinto", climas: [] },
      { slot: "bolsa", climas: [] },
    ]);

    expect(resultado).toEqual({ climas: ["leve"], misto: false });
  });

  it("ignora peça de slot sem clima mesmo que tenha dado sujo (linhas antigas)", () => {
    const resultado = derivarClimaLook([
      { slot: "parte_de_cima", climas: ["leve"] },
      { slot: "cinto", climas: ["pesada"] }, // dado antigo indevido, deve ser ignorado
    ]);

    expect(resultado).toEqual({ climas: ["leve"], misto: false });
  });

  it("não é misto quando nenhuma peça relevante está presente", () => {
    const resultado = derivarClimaLook([
      { slot: "cinto", climas: [] },
      { slot: "bolsa", climas: [] },
    ]);

    expect(resultado).toEqual({ climas: [], misto: false });
  });

  it("uma única peça relevante: interseção é o próprio clima dela", () => {
    const resultado = derivarClimaLook([{ slot: "calcado", climas: ["leve", "pesada"] }]);

    expect(resultado).toEqual({ climas: ["leve", "pesada"], misto: false });
  });
});
