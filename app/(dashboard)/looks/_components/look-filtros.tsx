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
import { OCASIAO_LABELS } from "../_lib/schema";
import type { FiltrosLook } from "../_queries/listar-looks";

export function LookFiltros({
  capsulas,
  perfis,
  valoresAtuais,
}: {
  capsulas: Capsula[];
  perfis: PerfilEstilo[];
  valoresAtuais: FiltrosLook;
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
          placeholder="Nome do look"
          defaultValue={valoresAtuais.busca}
          className="w-40"
        />
      </div>

      <SeletorSimples
        nome="ocasiao"
        rotulo="Ocasião"
        valorAtual={valoresAtuais.ocasiao}
        opcoes={Object.entries(OCASIAO_LABELS)}
      />
      <SeletorSimples
        nome="perfilEstiloId"
        rotulo="Perfil de estilo"
        valorAtual={valoresAtuais.perfilEstiloId}
        opcoes={perfis.map((p) => [p.id, p.nome] as const)}
      />
      <SeletorSimples
        nome="capsulaId"
        rotulo="Cápsula"
        valorAtual={valoresAtuais.capsulaId}
        opcoes={capsulas.map((c) => [c.id, c.nome] as const)}
      />
      <SeletorSimples
        nome="variante"
        rotulo="É variante?"
        valorAtual={valoresAtuais.variante}
        opcoes={[
          ["sim", "Sim"],
          ["nao", "Não"],
        ]}
      />

      <div className="flex gap-2">
        <Button type="submit" size="sm">
          Filtrar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/looks">Limpar</Link>}
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
