"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import type { Capsula, PerfilEstilo } from "@/db/schema";
import { pecaSchema } from "../../_lib/schema";
import { processarPlanilha, type ProcessarPlanilhaState } from "../_actions/processar-planilha";
import { confirmarCadastroEmMassa } from "../_actions/confirmar-cadastro-em-massa";
import { LinhaRevisao, type LinhaEstado } from "./linha-revisao";
import { Button } from "@/components/ui/button";

/**
 * Orquestra os 2 passos client-side (upload -> revisão/confirmar).
 * "Confirmar cadastro" não usa `<form action>` — são N peças com N
 * conjuntos de arquivo, não cabe num único form; a Server Action é
 * chamada direto com um FormData montado na mão (ver `confirmar`
 * abaixo), com `pending` via `useTransition`.
 */
export function CadastroEmMassa({
  opcoes,
}: {
  opcoes: { capsulas: Capsula[]; perfis: PerfilEstilo[] };
}) {
  const [estadoUpload, formActionUpload, pendingUpload] = useActionState(
    processarPlanilha,
    undefined as ProcessarPlanilhaState,
  );
  const [linhas, setLinhas] = useState<LinhaEstado[] | null>(null);
  const [pendingConfirmar, startTransition] = useTransition();

  // Ajusta o estado durante a renderização (mesmo padrão do resto do
  // projeto — ver CLAUDE.md) em vez de useEffect: assim que
  // `processarPlanilha` devolve linhas novas, entra em modo revisão.
  const [ultimoEstadoProcessado, setUltimoEstadoProcessado] = useState(estadoUpload);
  if (estadoUpload !== ultimoEstadoProcessado) {
    setUltimoEstadoProcessado(estadoUpload);
    if (estadoUpload && "linhas" in estadoUpload) {
      setLinhas(
        estadoUpload.linhas.map((l) => ({
          id: l.id,
          valores: l.valores,
          erro: l.erro,
          imagens: [],
        })),
      );
    }
  }

  function atualizarLinha(id: string, parcial: Partial<LinhaEstado["valores"]>) {
    setLinhas((atual) =>
      (atual ?? []).map((linha) => {
        if (linha.id !== id) return linha;
        const novosValores = { ...linha.valores, ...parcial };
        const validado = pecaSchema.safeParse(novosValores);
        return {
          ...linha,
          valores: novosValores,
          erro: validado.success ? undefined : validado.error.issues[0].message,
        };
      }),
    );
  }

  function atualizarImagens(id: string, arquivos: File[]) {
    setLinhas((atual) =>
      (atual ?? []).map((linha) => (linha.id === id ? { ...linha, imagens: arquivos } : linha)),
    );
  }

  function removerLinha(id: string) {
    setLinhas((atual) => (atual ?? []).filter((linha) => linha.id !== id));
  }

  function confirmar() {
    if (!linhas) return;
    const prontas = linhas.filter((l) => !l.erro && l.imagens.length > 0);
    if (prontas.length === 0) return;

    const formData = new FormData();
    formData.set("dados", JSON.stringify(prontas.map((l) => ({ id: l.id, valores: l.valores }))));
    for (const linha of prontas) {
      for (const arquivo of linha.imagens) {
        formData.append(`imagens-${linha.id}`, arquivo);
      }
    }

    startTransition(async () => {
      const resultados = await confirmarCadastroEmMassa(formData);
      setLinhas((atual) =>
        (atual ?? [])
          .map((linha) => {
            const resultado = resultados.find((r) => r.id === linha.id);
            if (!resultado) return linha;
            if (resultado.sucesso) return null;
            return { ...linha, erro: resultado.erro };
          })
          .filter((linha): linha is LinhaEstado => linha !== null),
      );
    });
  }

  if (!linhas) {
    return (
      <form action={formActionUpload} className="flex max-w-xl flex-col gap-4">
        <p className="text-muted-foreground">
          Baixe o modelo, preencha offline e suba o arquivo aqui.
        </p>
        <Link
          href="/pecas/em-massa/modelo"
          className="text-sm font-medium underline underline-offset-4"
        >
          Baixar modelo (.xlsx)
        </Link>
        <input type="file" name="arquivo" accept=".xlsx" required className="text-sm" />
        {estadoUpload && "erro" in estadoUpload && (
          <p className="text-sm text-destructive">{estadoUpload.erro}</p>
        )}
        <Button type="submit" disabled={pendingUpload} className="self-start">
          {pendingUpload ? "Lendo..." : "Subir planilha"}
        </Button>
      </form>
    );
  }

  const prontasParaConfirmar = linhas.filter((l) => !l.erro && l.imagens.length > 0).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">{linhas.length} peça(s) na revisão</p>
        <Button
          type="button"
          onClick={confirmar}
          disabled={pendingConfirmar || prontasParaConfirmar === 0}
        >
          {pendingConfirmar ? "Cadastrando..." : `Confirmar cadastro (${prontasParaConfirmar})`}
        </Button>
      </div>

      {linhas.length === 0 && (
        <p className="text-muted-foreground">Todas as peças foram cadastradas.</p>
      )}

      <div className="flex flex-col gap-4">
        {linhas.map((linha) => {
          const erroExibido =
            linha.erro ?? (linha.imagens.length === 0 ? "Adicione ao menos uma imagem." : undefined);
          return (
            <LinhaRevisao
              key={linha.id}
              linha={{ ...linha, erro: erroExibido }}
              opcoes={opcoes}
              onChange={(parcial) => atualizarLinha(linha.id, parcial)}
              onChangeImagens={(arquivos) => atualizarImagens(linha.id, arquivos)}
              onRemover={() => removerLinha(linha.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
