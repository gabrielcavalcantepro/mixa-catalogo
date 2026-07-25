import { describe, expect, it } from "vitest";
import { mapearLook, type LookComRelacoes } from "./mapear";

const lookBase: LookComRelacoes = {
  id: "look-1",
  nome: "Reunião casual",
  climaMisto: false,
  capsula: { id: "cap-1", nome: "Verão 26", dataLancamento: new Date("2026-01-15") },
  varianteDe: null,
  pecas: [
    {
      slot: "parte_de_cima",
      peca: {
        id: "peca-1",
        nome: "Camisa linho",
        imagens: [{ url: "/uploads/camisa.jpg", isCapa: true }],
      },
    },
  ],
  ocasioes: [{ ocasiao: "trabalho" }],
  perfisEstilo: [
    {
      perfilEstilo: {
        id: "perfil-1",
        nome: "Minimalista",
        descricao: "Peças básicas",
        criadoEm: new Date("2026-01-01"),
      } as unknown as { id: string; nome: string },
    },
  ],
  climas: [{ pesoClima: "meia_estacao" }],
  slotsTrocados: [],
};

describe("mapearLook", () => {
  it("mapeia um look comum (sem variante) sem incluir slotsTrocados", () => {
    const resultado = mapearLook(lookBase);

    expect(resultado).toEqual({
      id: "look-1",
      nome: "Reunião casual",
      capsula: { id: "cap-1", nome: "Verão 26", dataLancamento: "2026-01-15" },
      clima: { climas: ["meia_estacao"], misto: false },
      ocasioes: ["trabalho"],
      perfisEstilo: [{ id: "perfil-1", nome: "Minimalista" }],
      pecas: [
        {
          slot: "parte_de_cima",
          peca: {
            id: "peca-1",
            nome: "Camisa linho",
            imagens: [{ url: "/uploads/camisa.jpg", isCapa: true }],
          },
        },
      ],
      varianteDe: null,
    });
    expect(resultado).not.toHaveProperty("slotsTrocados");
  });

  it("inclui slotsTrocados quando o look é variante de outro", () => {
    const lookVariante: LookComRelacoes = {
      ...lookBase,
      id: "look-2",
      varianteDe: {
        id: "look-1",
        nome: "Reunião casual",
        capsulaId: "cap-1",
        climaMisto: false,
      } as unknown as { id: string; nome: string | null },
      slotsTrocados: [{ slot: "cinto" }, { slot: "calcado" }],
    };

    const resultado = mapearLook(lookVariante);

    expect(resultado.varianteDe).toEqual({ id: "look-1", nome: "Reunião casual" });
    expect(resultado.slotsTrocados).toEqual(["cinto", "calcado"]);
  });

  it("marca climaMisto=true no campo clima.misto sem impedir a listagem de climas vazios", () => {
    const lookMisto: LookComRelacoes = { ...lookBase, climaMisto: true, climas: [] };

    const resultado = mapearLook(lookMisto);

    expect(resultado.clima).toEqual({ climas: [], misto: true });
  });
});
