"use client";

import { X } from "lucide-react";
import type { Capsula, PerfilEstilo } from "@/db/schema";
import {
  COR_TIPO_LABELS,
  OCASIAO_LABELS,
  PESO_CLIMA_LABELS,
  SLOTS_COM_CLIMA,
  SLOT_LABELS,
} from "../../_lib/schema";
import type { PecaFormValuesBruto } from "../_lib/planilha";
import { ImagemUploaderLinha } from "./imagem-uploader-linha";
import { Badge } from "@/components/ui/badge";
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

export type LinhaEstado = {
  id: string;
  valores: PecaFormValuesBruto;
  erro?: string;
  imagens: File[];
  /** Presente quando a linha veio da busca por IA (pecas-ia/), não da planilha. */
  origemCandidatoId?: string;
  imagemExistente?: { url: string; linkOrigem: string | null } | null;
  /** Nº de combinações que essa peça geraria no catálogo atual — só da busca por IA. */
  numeroCombinacoes?: number;
};

function alternarNaLista(lista: string[], valor: string, marcado: boolean): string[] {
  return marcado ? [...lista, valor] : lista.filter((v) => v !== valor);
}

export function LinhaRevisao({
  linha,
  opcoes,
  onChange,
  onChangeImagens,
  onRemover,
}: {
  linha: LinhaEstado;
  opcoes: { capsulas: Capsula[]; perfis: PerfilEstilo[] };
  onChange: (valores: Partial<PecaFormValuesBruto>) => void;
  onChangeImagens: (arquivos: File[]) => void;
  onRemover: () => void;
}) {
  const temClima = SLOTS_COM_CLIMA.includes(
    linha.valores.slot as (typeof SLOTS_COM_CLIMA)[number],
  );

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="grid flex-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Label className="flex items-center gap-2">
              Nome
              {linha.numeroCombinacoes !== undefined && (
                <Badge variant="secondary">{linha.numeroCombinacoes} combinações possíveis</Badge>
              )}
            </Label>
            <Input value={linha.valores.nome} onChange={(e) => onChange({ nome: e.target.value })} />
          </div>

          <div className="flex flex-col gap-1">
            <Label>Slot</Label>
            <Select
              value={linha.valores.slot}
              onValueChange={(v) => onChange({ slot: String(v) })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Escolha o slot">
                  {(valor: string) => SLOT_LABELS[valor as keyof typeof SLOT_LABELS] ?? valor}
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

          <div className="flex flex-col gap-1">
            <Label>Tipo de cor</Label>
            <Select
              value={linha.valores.corTipo}
              onValueChange={(v) => onChange({ corTipo: String(v) })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Neutra ou destaque">
                  {(valor: string) =>
                    COR_TIPO_LABELS[valor as keyof typeof COR_TIPO_LABELS] ?? valor
                  }
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

          <div className="flex flex-col gap-1">
            <Label>Cor</Label>
            <Input
              value={linha.valores.corValor}
              onChange={(e) => onChange({ corValor: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label>Cápsula</Label>
            <Select
              value={linha.valores.capsulaId}
              onValueChange={(v) => onChange({ capsulaId: String(v) })}
            >
              <SelectTrigger className="w-full">
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

          <div className="flex flex-col gap-1">
            <Label>Link afiliado (opcional)</Label>
            <Input
              value={linha.valores.linkAfiliado ?? ""}
              onChange={(e) => onChange({ linkAfiliado: e.target.value || null })}
            />
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          type="button"
          onClick={onRemover}
          aria-label="Remover peça da lista"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Switch
          checked={linha.valores.pecaChave}
          onCheckedChange={(marcado) => onChange({ pecaChave: marcado === true })}
        />
        <Label>Peça-chave</Label>
      </div>

      {temClima && (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">Clima da peça</legend>
          <div className="flex flex-wrap gap-4">
            {Object.entries(PESO_CLIMA_LABELS).map(([valor, rotulo]) => (
              <label key={valor} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={linha.valores.pesoClima.includes(valor)}
                  onCheckedChange={(marcado) =>
                    onChange({
                      pesoClima: alternarNaLista(linha.valores.pesoClima, valor, marcado === true),
                    })
                  }
                />
                {rotulo}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">Ocasiões</legend>
        <div className="flex flex-wrap gap-4">
          {Object.entries(OCASIAO_LABELS).map(([valor, rotulo]) => (
            <label key={valor} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={linha.valores.ocasiaoBase.includes(valor)}
                onCheckedChange={(marcado) =>
                  onChange({
                    ocasiaoBase: alternarNaLista(linha.valores.ocasiaoBase, valor, marcado === true),
                  })
                }
              />
              {rotulo}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">Perfis de estilo</legend>
        <div className="flex flex-wrap gap-4">
          {opcoes.perfis.map((perfil) => (
            <label key={perfil.id} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={linha.valores.perfilEstiloIds.includes(perfil.id)}
                onCheckedChange={(marcado) =>
                  onChange({
                    perfilEstiloIds: alternarNaLista(
                      linha.valores.perfilEstiloIds,
                      perfil.id,
                      marcado === true,
                    ),
                  })
                }
              />
              {perfil.nome}
            </label>
          ))}
        </div>
      </fieldset>

      <ImagemUploaderLinha
        arquivos={linha.imagens}
        imagemExistente={linha.imagemExistente}
        onChange={onChangeImagens}
      />

      {linha.erro && <p className="text-sm text-destructive">{linha.erro}</p>}
    </div>
  );
}
