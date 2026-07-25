import { describe, expect, it } from "vitest";
import { calcularSlotsTrocados } from "./calcular-slots-trocados";

describe("calcularSlotsTrocados", () => {
  it("detecta troca de duas peças ao mesmo tempo (ex.: cinto e sapato)", () => {
    const base = {
      parte_de_cima: "camisa-1",
      parte_de_baixo: "calca-1",
      calcado: "sapato-trabalho",
      cinto: "cinto-trabalho",
    };
    const variante = {
      parte_de_cima: "camisa-1",
      parte_de_baixo: "calca-1",
      calcado: "sapato-noite",
      cinto: "cinto-noite",
    };

    expect(calcularSlotsTrocados(base, variante).sort()).toEqual(["calcado", "cinto"]);
  });

  it("retorna lista vazia quando nada muda", () => {
    const base = { calcado: "sapato-1" };
    expect(calcularSlotsTrocados(base, { ...base })).toEqual([]);
  });

  it("conta slot adicionado como trocado", () => {
    const base = { parte_de_cima: "camisa-1" };
    const variante = { parte_de_cima: "camisa-1", bolsa: "bolsa-1" };

    expect(calcularSlotsTrocados(base, variante)).toEqual(["bolsa"]);
  });

  it("conta slot removido como trocado", () => {
    const base = { parte_de_cima: "camisa-1", bolsa: "bolsa-1" };
    const variante = { parte_de_cima: "camisa-1" };

    expect(calcularSlotsTrocados(base, variante)).toEqual(["bolsa"]);
  });
});
