import { describe, expect, it } from "vitest";
import { calcularFingerprint } from "./calcular-fingerprint";
import { gerarCandidatos, type PecaParaGeracao } from "./gerar-candidatos";

const CATALOGO: PecaParaGeracao[] = [
  { id: "topo-quente", slot: "parte_de_cima", climas: ["leve"], ocasioes: ["trabalho"], perfis: ["p1"] },
  { id: "topo-frio", slot: "parte_de_cima", climas: ["pesada"], ocasioes: ["trabalho"], perfis: ["p1"] },
  { id: "base-quente", slot: "parte_de_baixo", climas: ["leve"], ocasioes: ["trabalho"], perfis: ["p1"] },
  { id: "calcado-quente", slot: "calcado", climas: ["leve"], ocasioes: ["trabalho"], perfis: ["p1"] },
  { id: "cinto-1", slot: "cinto", climas: [], ocasioes: ["trabalho"], perfis: ["p1"] },
];

describe("gerarCandidatos", () => {
  it("poda combinação de clima incompatível (topo frio nunca aparece com base quente)", () => {
    const { candidatos } = gerarCandidatos(CATALOGO, []);

    for (const candidato of candidatos) {
      expect(Object.values(candidato.pecasPorSlot)).not.toContain("topo-frio");
    }
  });

  it("gera o núcleo (corpo+calçado) e a variante com cinto opcional — 2 candidatos", () => {
    const { candidatos } = gerarCandidatos(CATALOGO, []);

    expect(candidatos).toHaveLength(2);
    const semCinto = candidatos.find((c) => !c.pecasPorSlot.cinto);
    const comCinto = candidatos.find((c) => c.pecasPorSlot.cinto);
    expect(semCinto).toBeTruthy();
    expect(comCinto).toBeTruthy();
    expect(semCinto?.climas).toEqual(["leve"]);
    expect(comCinto?.climas).toEqual(["leve"]); // cinto não participa do clima
    expect(comCinto?.ocasioesSugeridas).toEqual(["trabalho"]);
  });

  it("não regenera uma combinação cujo fingerprint já existe (look aprovado ou candidato anterior)", () => {
    const primeiraGeracao = gerarCandidatos(CATALOGO, []);
    const fingerprintSemCinto = calcularFingerprint({
      parte_de_cima: "topo-quente",
      parte_de_baixo: "base-quente",
      calcado: "calcado-quente",
    });

    const segundaGeracao = gerarCandidatos(CATALOGO, [fingerprintSemCinto]);

    expect(primeiraGeracao.candidatos).toHaveLength(2);
    expect(segundaGeracao.candidatos).toHaveLength(1);
    expect(segundaGeracao.candidatos[0].pecasPorSlot.cinto).toBe("cinto-1");
  });

  it("rejeita combinação sem ocasião em comum", () => {
    const catalogoSemOcasiaoComum: PecaParaGeracao[] = [
      { id: "topo", slot: "parte_de_cima", climas: ["leve"], ocasioes: ["trabalho"], perfis: [] },
      { id: "base", slot: "parte_de_baixo", climas: ["leve"], ocasioes: ["treino"], perfis: [] },
      { id: "calcado", slot: "calcado", climas: ["leve"], ocasioes: ["trabalho", "treino"], perfis: [] },
    ];

    const { candidatos } = gerarCandidatos(catalogoSemOcasiaoComum, []);
    expect(candidatos).toHaveLength(0);
  });

  it("respeita o teto de combinações parciais e sinaliza truncamento", () => {
    const muitasPecas = (slot: string, n: number): PecaParaGeracao[] =>
      Array.from({ length: n }, (_, i) => ({
        id: `${slot}-${i}`,
        slot,
        climas: [],
        ocasioes: ["trabalho"],
        perfis: [],
      }));

    const catalogo: PecaParaGeracao[] = [
      { id: "topo", slot: "parte_de_cima", climas: ["leve"], ocasioes: ["trabalho"], perfis: [] },
      { id: "base", slot: "parte_de_baixo", climas: ["leve"], ocasioes: ["trabalho"], perfis: [] },
      { id: "calcado", slot: "calcado", climas: ["leve"], ocasioes: ["trabalho"], perfis: [] },
      ...muitasPecas("cinto", 20),
      ...muitasPecas("bolsa", 20),
    ];

    const { truncado } = gerarCandidatos(catalogo, [], { tetoCombinacoesParciais: 10 });
    expect(truncado).toBe(true);
  });
});
