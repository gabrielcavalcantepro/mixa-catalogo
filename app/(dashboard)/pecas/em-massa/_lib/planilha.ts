import ExcelJS from "exceljs";
import { SLOT_LABELS, COR_TIPO_LABELS, OCASIAO_LABELS } from "../../_lib/schema";

/**
 * Modelo de cadastro em massa — estrutura de coluna vem de
 * `modelo-cadastro-pecas-mixa (1).xlsx` (arquivo de referência do
 * usuário, não redesenhada aqui). Clima é a única coluna que difere do
 * form de peça única: lá é multi-select (0-3 climas); aqui é 1 escolha
 * só (Frio/Meia-estação/Quente/Qualquer) — limitação intencional,
 * documentada na aba "Instruções" do modelo. "Qualquer" expande pros 3
 * na importação; não dá pra combinar 2 climas específicos só pela
 * planilha (a peça pode ser editada depois pelo form único pra isso).
 */

const SIM_NAO = ["Sim", "Não"] as const;
export const CLIMA_OPCOES = ["Frio", "Meia-estação", "Quente", "Qualquer"] as const;

const CLIMA_PARA_PESO_CLIMA: Record<string, string[]> = {
  Frio: ["pesada"],
  "Meia-estação": ["meia_estacao"],
  Quente: ["leve"],
  Qualquer: ["pesada", "meia_estacao", "leve"],
};

const SLOT_LABEL_PARA_VALOR = Object.fromEntries(
  Object.entries(SLOT_LABELS).map(([valor, rotulo]) => [rotulo, valor]),
);
const COR_TIPO_LABEL_PARA_VALOR = Object.fromEntries(
  Object.entries(COR_TIPO_LABELS).map(([valor, rotulo]) => [rotulo, valor]),
);

type Coluna = { titulo: string; opcoes?: readonly string[] };

export function montarColunas(opcoes: {
  capsulas: { nome: string }[];
  perfis: { nome: string }[];
}): Coluna[] {
  return [
    { titulo: "Nome" },
    { titulo: "Slot", opcoes: Object.values(SLOT_LABELS) },
    { titulo: "Tipo de cor", opcoes: Object.values(COR_TIPO_LABELS) },
    { titulo: "Cor" },
    { titulo: "Cápsula", opcoes: opcoes.capsulas.map((c) => c.nome) },
    { titulo: "Peça-chave", opcoes: SIM_NAO },
    { titulo: "Link afiliado (opcional)" },
    { titulo: "Clima", opcoes: CLIMA_OPCOES },
    ...Object.values(OCASIAO_LABELS).map((rotulo) => ({
      titulo: `Ocasião: ${rotulo}`,
      opcoes: SIM_NAO,
    })),
    ...opcoes.perfis.map((p) => ({ titulo: `Estilo: ${p.nome}`, opcoes: SIM_NAO })),
  ];
}

const ULTIMA_LINHA_DROPDOWN = 500;

const INSTRUCOES = [
  "Como preencher esta planilha",
  "",
  "1 linha = 1 peça. Não pule linhas nem deixe linha em branco no meio.",
  "",
  "Colunas com lista suspensa: clique na célula e escolha uma opção da lista — não digite valor livre nessas colunas.",
  "",
  "Clima é 1 escolha só nesta planilha: Frio, Meia-estação, Quente, ou Qualquer (o sistema marca os 3 automaticamente na importação). Não dá pra combinar 2 climas específicos por aqui (ex.: só Frio + Meia-estação) — pra isso, cadastra a peça avulsa depois e ajusta ali.",
  "",
  "Ocasião e Estilo continuam de múltipla escolha — uma coluna por opção, Sim ou Não.",
  "",
  "A coluna Cápsula é gerada na hora que você baixa esta planilha, com as cápsulas que existem no catálogo naquele momento — se criar uma cápsula nova depois, baixe o modelo de novo pra ela aparecer.",
  "",
  "Imagem de cada peça não é enviada por aqui — depois de subir esta planilha, uma tela de revisão mostra todas as peças lidas, e é lá que você sobe a foto de cada uma antes de confirmar o cadastro em massa.",
  "",
  "A linha 2 (em destaque) é exemplo, só referência — apague ou substitua antes de subir o arquivo.",
];

export async function gerarModeloPlanilha(opcoes: {
  capsulas: { nome: string }[];
  perfis: { nome: string }[];
}): Promise<Buffer> {
  const colunas = montarColunas(opcoes);
  const workbook = new ExcelJS.Workbook();

  const sheet = workbook.addWorksheet("Peças", { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = colunas.map((c) => ({ header: c.titulo, width: Math.max(14, c.titulo.length) }));
  sheet.getRow(1).font = { bold: true };

  const linhaExemplo: Record<string, string> = {
    Nome: "Blazer preto oversized",
    Slot: SLOT_LABELS.sobreposicao,
    "Tipo de cor": COR_TIPO_LABELS.neutra,
    Cor: "Preto",
    Cápsula: opcoes.capsulas[0]?.nome ?? "",
    "Peça-chave": "Sim",
    "Link afiliado (opcional)": "",
    Clima: "Meia-estação",
    "Ocasião: Trabalho": "Sim",
    "Ocasião: Lazer": "Não",
    "Ocasião: Casa": "Não",
    "Ocasião: Treino": "Não",
    "Ocasião: Evento": "Sim",
  };
  for (const perfil of opcoes.perfis) {
    linhaExemplo[`Estilo: ${perfil.nome}`] = "Não";
  }
  const linha2 = sheet.addRow(colunas.map((c) => linhaExemplo[c.titulo] ?? ""));
  linha2.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFCE8B2" } };
  });

  colunas.forEach((coluna, indice) => {
    if (!coluna.opcoes) return;
    const letra = sheet.getColumn(indice + 1).letter;
    const ehClima = coluna.titulo === "Clima";
    const ehCapsula = coluna.titulo === "Cápsula";
    for (let linha = 2; linha <= ULTIMA_LINHA_DROPDOWN; linha++) {
      sheet.getCell(`${letra}${linha}`).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [`"${coluna.opcoes.join(",")}"`],
        showInputMessage: ehClima || ehCapsula,
        promptTitle: ehClima || ehCapsula ? "Selecione uma opção" : undefined,
        prompt: ehClima
          ? '"Qualquer" marca os 3 climas automaticamente na importação.'
          : ehCapsula
            ? "Gerada na hora do download — sempre reflete as cápsulas que existem no catálogo naquele momento."
            : undefined,
      };
    }
  });

  const instrucoes = workbook.addWorksheet("Instruções");
  instrucoes.getColumn(1).width = 100;
  INSTRUCOES.forEach((texto, indice) => {
    const row = instrucoes.addRow([texto]);
    if (indice === 0) row.font = { bold: true, size: 13 };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function lerLinhasDaPlanilha(buffer: Buffer): Promise<Record<string, string>[]> {
  const workbook = new ExcelJS.Workbook();
  // Cast pontual: o tipo `Buffer` do @types/node instalado (com generic
  // ArrayBufferLike) não bate estruturalmente com o `Buffer` esperado
  // pela declaração de tipos do exceljs — sem impacto em runtime.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await workbook.xlsx.load(buffer as any);
  const sheet = workbook.getWorksheet("Peças");
  if (!sheet) return [];

  const cabecalho: string[] = [];
  sheet.getRow(1).eachCell({ includeEmpty: true }, (cell, indice) => {
    cabecalho[indice] = String(cell.value ?? "").trim();
  });

  const linhas: Record<string, string>[] = [];
  sheet.eachRow((row, numeroLinha) => {
    if (numeroLinha === 1) return;
    const linha: Record<string, string> = {};
    row.eachCell({ includeEmpty: true }, (cell, indice) => {
      const titulo = cabecalho[indice];
      if (titulo) linha[titulo] = String(cell.text ?? cell.value ?? "").trim();
    });
    if ((linha["Nome"] ?? "") !== "") {
      linhas.push(linha);
    }
  });

  return linhas;
}

/** Forma pronta pra alimentar `pecaSchema.safeParse` (mesma validação do form único). */
export type PecaFormValuesBruto = {
  nome: string;
  slot: string;
  corTipo: string;
  corValor: string;
  pecaChave: boolean;
  capsulaId: string;
  linkAfiliado: string | null;
  pesoClima: string[];
  perfilEstiloIds: string[];
  ocasiaoBase: string[];
};

/**
 * Mapeia uma linha lida da planilha (texto cru, por título de coluna)
 * pro formato de entrada do `pecaSchema`. Resolução de nome (cápsula)
 * é a única checagem feita aqui — regra de validação de verdade (slot
 * válido, clima só nos slots certos, cápsula/perfil obrigatórios etc.)
 * fica inteiramente a cargo do `pecaSchema.safeParse` de quem chama
 * essa função, exatamente como o form de peça única.
 */
export function mapearLinhaParaPecaFormValues(
  linha: Record<string, string | undefined>,
  contexto: {
    capsulaIdPorNome: Map<string, string>;
    perfilIdPorNome: Map<string, string>;
    nomesPerfis: string[];
  },
): { valores: PecaFormValuesBruto; erro?: string } {
  const capsulaNome = (linha["Cápsula"] ?? "").trim();
  const capsulaId = contexto.capsulaIdPorNome.get(capsulaNome);

  const slotRotulo = (linha["Slot"] ?? "").trim();
  const corTipoRotulo = (linha["Tipo de cor"] ?? "").trim();
  const climaRotulo = (linha["Clima"] ?? "").trim();

  const ehSim = (valor: string | undefined) => (valor ?? "").trim().toLowerCase() === "sim";

  const ocasiaoBase = Object.entries(OCASIAO_LABELS)
    .filter(([, rotulo]) => ehSim(linha[`Ocasião: ${rotulo}`]))
    .map(([valor]) => valor);

  const perfilEstiloIds = contexto.nomesPerfis
    .filter((nomePerfil) => ehSim(linha[`Estilo: ${nomePerfil}`]))
    .map((nomePerfil) => contexto.perfilIdPorNome.get(nomePerfil))
    .filter((id): id is string => Boolean(id));

  return {
    valores: {
      nome: (linha["Nome"] ?? "").trim(),
      slot: SLOT_LABEL_PARA_VALOR[slotRotulo] ?? "",
      corTipo: COR_TIPO_LABEL_PARA_VALOR[corTipoRotulo] ?? "",
      corValor: (linha["Cor"] ?? "").trim(),
      pecaChave: ehSim(linha["Peça-chave"]),
      capsulaId: capsulaId ?? "",
      linkAfiliado: (linha["Link afiliado (opcional)"] ?? "").trim() || null,
      pesoClima: CLIMA_PARA_PESO_CLIMA[climaRotulo] ?? [],
      perfilEstiloIds,
      ocasiaoBase,
    },
    erro: capsulaId ? undefined : `Cápsula "${capsulaNome}" não existe no catálogo.`,
  };
}
