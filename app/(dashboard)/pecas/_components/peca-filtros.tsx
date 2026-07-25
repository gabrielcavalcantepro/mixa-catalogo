"use client";

import Link from "next/link";
import type { Capsula, PerfilEstilo } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  COR_TIPO_LABELS,
  OCASIAO_LABELS,
  PESO_CLIMA_LABELS,
  SLOT_LABELS,
} from "../_lib/schema";
import type { FiltrosPeca } from "../_queries/listar-pecas";

export function PecaFiltros({
  capsulas,
  perfis,
  valoresAtuais,
}: {
  capsulas: Capsula[];
  perfis: PerfilEstilo[];
  valoresAtuais: FiltrosPeca;
}) {
  return (
    <form className="flex flex-wrap items-end gap-3 rounded-lg border border-border p-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground" htmlFor="busca">
          Buscar
        </label>
        <Input
          id="busca"
          name="busca"
          placeholder="Nome da peça"
          defaultValue={valoresAtuais.busca}
          className="w-40"
        />
      </div>

      <SeletorSimples
        nome="slot"
        rotulo="Slot"
        valorAtual={valoresAtuais.slot}
        opcoes={Object.entries(SLOT_LABELS)}
      />
      <SeletorSimples
        nome="corTipo"
        rotulo="Cor"
        valorAtual={valoresAtuais.corTipo}
        opcoes={Object.entries(COR_TIPO_LABELS)}
      />
      <SeletorSimples
        nome="ocasiaoBase"
        rotulo="Ocasião"
        valorAtual={valoresAtuais.ocasiaoBase}
        opcoes={Object.entries(OCASIAO_LABELS)}
      />
      <SeletorSimples
        nome="capsulaId"
        rotulo="Cápsula"
        valorAtual={valoresAtuais.capsulaId}
        opcoes={capsulas.map((c) => [c.id, c.nome] as const)}
      />
      <SeletorSimples
        nome="perfilEstiloId"
        rotulo="Perfil de estilo"
        valorAtual={valoresAtuais.perfilEstiloId}
        opcoes={perfis.map((p) => [p.id, p.nome] as const)}
      />
      <SeletorSimples
        nome="pecaChave"
        rotulo="Peça-chave"
        valorAtual={valoresAtuais.pecaChave}
        opcoes={[
          ["sim", "Sim"],
          ["nao", "Não"],
        ]}
      />

      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Clima da peça</span>
        <div className="flex gap-3 pt-1.5">
          {Object.entries(PESO_CLIMA_LABELS).map(([valor, rotulo]) => (
            <label key={valor} className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                name="pesoClima"
                value={valor}
                defaultChecked={valoresAtuais.pesoClima?.includes(valor)}
                className="size-4 accent-foreground"
              />
              {rotulo}
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm">
          Filtrar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/pecas">Limpar</Link>}
        />
      </div>
    </form>
  );
}

function SeletorSimples({
  nome,
  rotulo,
  valorAtual,
  opcoes,
}: {
  nome: string;
  rotulo: string;
  valorAtual?: string;
  opcoes: readonly (readonly [string, string])[];
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-muted-foreground" htmlFor={nome}>
        {rotulo}
      </label>
      <Select name={nome} defaultValue={valorAtual ?? ""}>
        <SelectTrigger id={nome} className="w-40">
          <SelectValue>
            {(valor: string) => opcoes.find(([v]) => v === valor)?.[1] ?? "Todos"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Todos</SelectItem>
          {opcoes.map(([valor, texto]) => (
            <SelectItem key={valor} value={valor}>
              {texto}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
