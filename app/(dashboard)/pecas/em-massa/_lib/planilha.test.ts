import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { pecaSchema } from "../../_lib/schema";
import {
  gerarModeloPlanilha,
  lerLinhasDaPlanilha,
  mapearLinhaParaPecaFormValues,
} from "./planilha";

const CAPSULA_ID = "11111111-1111-4111-8111-111111111111";
const PERFIL_ESPORTIVO_ID = "22222222-2222-4222-8222-222222222222";
const PERFIL_TRADICIONAL_ID = "33333333-3333-4333-8333-333333333333";

const contexto = {
  capsulaIdPorNome: new Map([["Verão 2026", CAPSULA_ID]]),
  perfilIdPorNome: new Map([
    ["Esportivo", PERFIL_ESPORTIVO_ID],
    ["Tradicional", PERFIL_TRADICIONAL_ID],
  ]),
  nomesPerfis: ["Esportivo", "Tradicional"],
};

function linhaBase(sobrescritas: Record<string, string> = {}) {
  return {
    Nome: "Blazer preto",
    Slot: "Parte de cima",
    "Tipo de cor": "Neutra",
    Cor: "Preto",
    Cápsula: "Verão 2026",
    "Peça-chave": "Sim",
    "Link afiliado (opcional)": "",
    Clima: "Meia-estação",
    "Ocasião: Trabalho": "Sim",
    "Ocasião: Lazer": "Não",
    "Ocasião: Casa": "Não",
    "Ocasião: Treino": "Não",
    "Ocasião: Evento": "Sim",
    "Estilo: Esportivo": "Não",
    "Estilo: Tradicional": "Sim",
    ...sobrescritas,
  };
}

describe("mapearLinhaParaPecaFormValues", () => {
  it("mapeia uma linha válida corretamente", () => {
    const resultado = mapearLinhaParaPecaFormValues(linhaBase(), contexto);
    expect(resultado).toEqual({
      valores: {
        nome: "Blazer preto",
        slot: "parte_de_cima",
        corTipo: "neutra",
        corValor: "Preto",
        pecaChave: true,
        capsulaId: CAPSULA_ID,
        linkAfiliado: null,
        pesoClima: ["meia_estacao"],
        perfilEstiloIds: [PERFIL_TRADICIONAL_ID],
        ocasiaoBase: ["trabalho", "evento"],
      },
      erro: undefined,
    });
  });

  it("erro quando a cápsula não existe no catálogo (mas o resto da linha continua mapeado, pra edição)", () => {
    const resultado = mapearLinhaParaPecaFormValues(
      linhaBase({ Cápsula: "Cápsula inexistente" }),
      contexto,
    );
    expect(resultado.erro).toBe('Cápsula "Cápsula inexistente" não existe no catálogo.');
    expect(resultado.valores.capsulaId).toBe("");
    expect(resultado.valores.nome).toBe("Blazer preto");
  });

  it('Clima "Qualquer" expande pros 3 valores de pesoClima', () => {
    const resultado = mapearLinhaParaPecaFormValues(linhaBase({ Clima: "Qualquer" }), contexto);
    expect(resultado.valores.pesoClima).toEqual(["pesada", "meia_estacao", "leve"]);
  });

  it("Clima com um valor específico marca só aquele", () => {
    const resultado = mapearLinhaParaPecaFormValues(linhaBase({ Clima: "Frio" }), contexto);
    expect(resultado.valores.pesoClima).toEqual(["pesada"]);
  });

  it("Clima vazio vira lista vazia de pesoClima", () => {
    const resultado = mapearLinhaParaPecaFormValues(linhaBase({ Clima: "" }), contexto);
    expect(resultado.valores.pesoClima).toEqual([]);
  });

  it("integração com pecaSchema: peça válida passa", () => {
    const resultado = mapearLinhaParaPecaFormValues(linhaBase(), contexto);
    expect(resultado.erro).toBeUndefined();
    expect(pecaSchema.safeParse(resultado.valores).success).toBe(true);
  });

  it("integração com pecaSchema: clima preenchido num slot sem clima (cinto) é rejeitado — mesma regra do form único", () => {
    const resultado = mapearLinhaParaPecaFormValues(
      linhaBase({ Slot: "Cinto", Clima: "Frio" }),
      contexto,
    );
    expect(resultado.erro).toBeUndefined();
    const validado = pecaSchema.safeParse(resultado.valores);
    expect(validado.success).toBe(false);
  });
});

describe("gerarModeloPlanilha + lerLinhasDaPlanilha (round-trip)", () => {
  it("gera e lê de volta a linha de exemplo corretamente", async () => {
    const buffer = await gerarModeloPlanilha({
      capsulas: [{ nome: "Verão 2026" }],
      perfis: [{ nome: "Esportivo" }, { nome: "Tradicional" }],
    });
    const linhas = await lerLinhasDaPlanilha(buffer);

    expect(linhas).toHaveLength(1);
    expect(linhas[0].Nome).toBe("Blazer preto oversized");
    expect(linhas[0].Cápsula).toBe("Verão 2026");
    expect(linhas[0].Clima).toBe("Meia-estação");
  });

  it("linha em branco (sem Nome) no meio dos dados é ignorada", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Peças");
    sheet.addRow(["Nome", "Cápsula"]);
    sheet.addRow(["Camiseta branca", "Verão 2026"]);
    sheet.addRow(["", ""]);
    sheet.addRow(["Calça preta", "Verão 2026"]);
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

    const linhas = await lerLinhasDaPlanilha(buffer);

    expect(linhas).toHaveLength(2);
    expect(linhas.map((l) => l.Nome)).toEqual(["Camiseta branca", "Calça preta"]);
  });
});
