"use client";

import { useActionState, type ReactNode } from "react";
import type { PerfilEstilo } from "@/db/schema";
import type { LookActionState, LookValoresFormulario } from "../_lib/schema";
import { OCASIAO_LABELS, SLOT_LABELS } from "../_lib/schema";
import { SeletorPecaDoSlot, type PecaOpcaoComImagem } from "./seletor-peca-do-slot";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PecaOpcao = PecaOpcaoComImagem & { slot: string };

type Props = {
  action: (
    estadoAnterior: LookActionState,
    formData: FormData,
  ) => Promise<LookActionState>;
  opcoes: { pecas: PecaOpcao[]; perfis: PerfilEstilo[] };
  valoresIniciais?: LookValoresFormulario;
  textoBotao: string;
  /**
   * Campos extras específicos de um fluxo (ex.: "é variante de" só na
   * revisão de candidato) — recebe os valores atuais do form (já
   * considerando o eco de erro) pra poder participar do mesmo mecanismo
   * de "não perder o que foi preenchido". `undefined` em criar/editar
   * look, que não têm campo extra nenhum.
   */
  camposExtras?: (valoresAtuais: LookValoresFormulario | undefined) => ReactNode;
};

export function LookForm({ action, opcoes, valoresIniciais, textoBotao, camposExtras }: Props) {
  const [estado, formAction, pending] = useActionState(action, undefined);

  // Idem peca-form.tsx: usa o que foi de fato submetido (quando a action
  // retorna erro) em vez de só os valores iniciais, senão o form "esquece"
  // tudo que o usuário marcou assim que aparece um erro de validação.
  const valoresAtuais = estado?.valores ?? valoresIniciais;

  const pecasDoSlot = (slot: string) => opcoes.pecas.filter((p) => p.slot === slot);
  const valorDoSlot = (slot: string) => valoresAtuais?.pecasPorSlot[slot] ?? "";

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 sm:max-w-sm">
        <Label htmlFor="nome">Nome do look (opcional)</Label>
        <Input
          id="nome"
          name="nome"
          defaultValue={valoresAtuais?.nome ?? ""}
          placeholder="Ex.: Reunião de trabalho"
        />
      </div>

      {camposExtras?.(valoresAtuais)}

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 text-sm font-medium">Peças por slot</legend>
        <div className="flex flex-col gap-4">
          {/* Peça única e parte de cima são alternativas — só uma se usa por vez. */}
          <div className="grid gap-4 sm:grid-cols-2">
            <SeletorPecaDoSlot
              slot="peca_unica"
              rotulo={SLOT_LABELS.peca_unica}
              opcoes={pecasDoSlot("peca_unica")}
              valorInicial={valorDoSlot("peca_unica")}
            />
            <SeletorPecaDoSlot
              slot="parte_de_cima"
              rotulo={SLOT_LABELS.parte_de_cima}
              opcoes={pecasDoSlot("parte_de_cima")}
              valorInicial={valorDoSlot("parte_de_cima")}
            />
          </div>
          <SeletorPecaDoSlot
            slot="parte_de_baixo"
            rotulo={SLOT_LABELS.parte_de_baixo}
            opcoes={pecasDoSlot("parte_de_baixo")}
            valorInicial={valorDoSlot("parte_de_baixo")}
          />
          <SeletorPecaDoSlot
            slot="sobreposicao"
            rotulo={SLOT_LABELS.sobreposicao}
            opcoes={pecasDoSlot("sobreposicao")}
            valorInicial={valorDoSlot("sobreposicao")}
          />
          <SeletorPecaDoSlot
            slot="calcado"
            rotulo={SLOT_LABELS.calcado}
            opcoes={pecasDoSlot("calcado")}
            valorInicial={valorDoSlot("calcado")}
          />
          <SeletorPecaDoSlot
            slot="cinto"
            rotulo={SLOT_LABELS.cinto}
            opcoes={pecasDoSlot("cinto")}
            valorInicial={valorDoSlot("cinto")}
          />
          <SeletorPecaDoSlot
            slot="bolsa"
            rotulo={SLOT_LABELS.bolsa}
            opcoes={pecasDoSlot("bolsa")}
            valorInicial={valorDoSlot("bolsa")}
          />
          <SeletorPecaDoSlot
            slot="acessorio_outro"
            rotulo={SLOT_LABELS.acessorio_outro}
            opcoes={pecasDoSlot("acessorio_outro")}
            valorInicial={valorDoSlot("acessorio_outro")}
          />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-medium">Ocasião(ões)</legend>
        <div className="flex flex-wrap gap-4">
          {Object.entries(OCASIAO_LABELS).map(([valor, rotulo]) => (
            <label key={valor} className="flex items-center gap-2 text-sm">
              <Checkbox
                name="ocasiao"
                value={valor}
                defaultChecked={valoresAtuais?.ocasiao.includes(valor)}
              />
              {rotulo}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-medium">Perfil(is) de estilo</legend>
        <div className="flex flex-wrap gap-4">
          {opcoes.perfis.map((perfil) => (
            <label key={perfil.id} className="flex items-center gap-2 text-sm">
              <Checkbox
                name="perfilEstiloIds"
                value={perfil.id}
                defaultChecked={valoresAtuais?.perfilEstiloIds.includes(perfil.id)}
              />
              {perfil.nome}
            </label>
          ))}
        </div>
      </fieldset>

      {estado?.erro && <p className="text-sm text-destructive">{estado.erro}</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Salvando..." : textoBotao}
      </Button>
    </form>
  );
}
