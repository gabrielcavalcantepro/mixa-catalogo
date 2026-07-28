"use client";

import { useTransition } from "react";
import type { Capsula, PerfilEstilo } from "@/db/schema";
import { CadastroEmMassa } from "../../pecas/em-massa/_components/cadastro-em-massa";
import type { LinhaEstado } from "../../pecas/em-massa/_components/linha-revisao";
import { rejeitarCandidatoIaAction } from "../_actions/rejeitar-candidato-ia";
import { BuscarForm } from "./buscar-form";

/**
 * Junta o form de "escolher estilo + gerar" com a MESMA tela de
 * revisão do cadastro em massa (`CadastroEmMassa`, de
 * pecas/em-massa/) — nenhuma UI de revisão nova, só a origem das
 * linhas muda (candidatos da IA em vez de linhas de planilha).
 */
export function AbaBuscar({
  perfis,
  capsulas,
  linhasIniciais,
}: {
  perfis: PerfilEstilo[];
  capsulas: Capsula[];
  linhasIniciais: LinhaEstado[];
}) {
  const [, startTransition] = useTransition();

  function aoRemoverExtra(linha: LinhaEstado) {
    if (!linha.origemCandidatoId) return;
    const candidatoId = linha.origemCandidatoId;
    startTransition(async () => {
      await rejeitarCandidatoIaAction(candidatoId);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <BuscarForm perfis={perfis} />
      <CadastroEmMassa
        opcoes={{ capsulas, perfis }}
        linhasIniciais={linhasIniciais}
        aoRemoverExtra={aoRemoverExtra}
      />
    </div>
  );
}
