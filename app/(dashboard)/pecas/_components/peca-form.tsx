"use client";

import { useActionState, useState } from "react";
import type { Capsula, PerfilEstilo } from "@/db/schema";
import type { PecaActionState, PecaValoresFormulario } from "../_lib/schema";
import {
  COR_TIPO_LABELS,
  OCASIAO_LABELS,
  PESO_CLIMA_LABELS,
  SLOTS_COM_CLIMA,
  SLOT_LABELS,
} from "../_lib/schema";
import { PecaImageUploader } from "./peca-image-uploader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

type Props = {
  action: (
    estadoAnterior: PecaActionState,
    formData: FormData,
  ) => Promise<PecaActionState>;
  opcoes: { capsulas: Capsula[]; perfis: PerfilEstilo[] };
  valoresIniciais?: PecaValoresFormulario;
  textoBotao: string;
};

export function PecaForm({ action, opcoes, valoresIniciais, textoBotao }: Props) {
  const [estado, formAction, pending] = useActionState(action, undefined);

  // Os valores submetidos (quando a action retorna erro) têm prioridade
  // sobre os iniciais — é isso que faz o form "lembrar" o que o usuário
  // preencheu em vez de voltar a ficar vazio (ver CLAUDE.md, item do
  // reset automático do React em `<form action>`).
  const valoresAtuais = estado?.valores ?? valoresIniciais;

  // Ajusta o estado durante a renderização (padrão recomendado pelo React
  // pra "resetar" estado quando uma prop muda) em vez de um useEffect —
  // evita o frame extra de re-render e o lint de setState-em-efeito.
  // Importante: comparar/guardar sempre a MESMA forma já normalizada
  // (`slotDeReferencia`), senão `undefined` nunca bate com `""` e o
  // efeito nunca "assenta" — causa loop infinito de render.
  const slotDeReferencia = valoresAtuais?.slot ?? "";
  const [slotAtual, setSlotAtual] = useState(slotDeReferencia);
  const [ultimoSlotSincronizado, setUltimoSlotSincronizado] = useState(slotDeReferencia);
  if (slotDeReferencia !== ultimoSlotSincronizado) {
    setUltimoSlotSincronizado(slotDeReferencia);
    setSlotAtual(slotDeReferencia);
  }

  const temClima = SLOTS_COM_CLIMA.includes(slotAtual as (typeof SLOTS_COM_CLIMA)[number]);

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="nome">Nome</Label>
          <Input
            id="nome"
            name="nome"
            required
            defaultValue={valoresAtuais?.nome}
            placeholder="Ex.: Blazer alfaiataria preto"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="slot">Slot</Label>
          <Select
            name="slot"
            defaultValue={valoresAtuais?.slot}
            onValueChange={(valor) => setSlotAtual(String(valor))}
            required
          >
            <SelectTrigger id="slot" className="w-full">
              <SelectValue placeholder="Escolha o slot">
                {(valor: string) => SLOT_LABELS[valor as keyof typeof SLOT_LABELS]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SLOT_LABELS).map(([valor, rotulo]) => (
                <SelectItem key={valor} value={valor}>
                  {rotulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="corTipo">Tipo de cor</Label>
          <Select name="corTipo" defaultValue={valoresAtuais?.corTipo} required>
            <SelectTrigger id="corTipo" className="w-full">
              <SelectValue placeholder="Neutra ou destaque">
                {(valor: string) => COR_TIPO_LABELS[valor as keyof typeof COR_TIPO_LABELS]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(COR_TIPO_LABELS).map(([valor, rotulo]) => (
                <SelectItem key={valor} value={valor}>
                  {rotulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="corValor">Cor</Label>
          <Input
            id="corValor"
            name="corValor"
            required
            defaultValue={valoresAtuais?.corValor}
            placeholder="Ex.: preto, camel, verde-oliva"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="capsulaId">Cápsula</Label>
          <Select name="capsulaId" defaultValue={valoresAtuais?.capsulaId} required>
            <SelectTrigger id="capsulaId" className="w-full">
              <SelectValue placeholder="Escolha a cápsula">
                {(valor: string) => opcoes.capsulas.find((c) => c.id === valor)?.nome}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {opcoes.capsulas.map((capsula) => (
                <SelectItem key={capsula.id} value={capsula.id}>
                  {capsula.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="linkAfiliado">Link de afiliado (opcional)</Label>
          <Input
            id="linkAfiliado"
            name="linkAfiliado"
            type="url"
            defaultValue={valoresAtuais?.linkAfiliado ?? ""}
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Switch
          id="pecaChave"
          name="pecaChave"
          defaultChecked={valoresAtuais?.pecaChave}
        />
        <Label htmlFor="pecaChave">
          Peça-chave (coringa) — usada para trocar a ocasião de um look
        </Label>
      </div>

      {temClima && (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-medium">Clima da peça</legend>
          <div className="flex flex-wrap gap-4">
            {Object.entries(PESO_CLIMA_LABELS).map(([valor, rotulo]) => (
              <label key={valor} className="flex items-center gap-2 text-sm">
                <Checkbox
                  name="pesoClima"
                  value={valor}
                  defaultChecked={valoresAtuais?.pesoClima.includes(valor)}
                />
                {rotulo}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-medium">Ocasiões que atende sozinha</legend>
        <div className="flex flex-wrap gap-4">
          {Object.entries(OCASIAO_LABELS).map(([valor, rotulo]) => (
            <label key={valor} className="flex items-center gap-2 text-sm">
              <Checkbox
                name="ocasiaoBase"
                value={valor}
                defaultChecked={valoresAtuais?.ocasiaoBase.includes(valor)}
              />
              {rotulo}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-medium">Perfis de estilo</legend>
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

      <PecaImageUploader imagensExistentes={valoresIniciais?.imagens} />

      {estado?.erro && <p className="text-sm text-destructive">{estado.erro}</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Salvando..." : textoBotao}
      </Button>
    </form>
  );
}
