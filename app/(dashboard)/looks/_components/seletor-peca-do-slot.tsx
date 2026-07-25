"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type PecaOpcaoComImagem = {
  id: string;
  nome: string;
  corValor: string;
  imagens: { url: string; isCapa: boolean }[];
};

type Props = {
  slot: string;
  rotulo: string;
  opcoes: PecaOpcaoComImagem[];
  valorInicial: string;
};

/**
 * Seletor de peça + imagem lado a lado, pra um slot — a imagem vem do
 * MESMO estado que alimenta o seletor (nunca de uma fonte separada,
 * tipo uma colagem calculada à parte), pra nunca dessincronizar quando
 * o usuário troca a peça escolhida. Compartilhado entre criar look,
 * editar look e revisar candidato (todos via `LookForm`).
 */
export function SeletorPecaDoSlot({ slot, rotulo, opcoes, valorInicial }: Props) {
  // Mesmo padrão de peca-form.tsx (ajustar estado durante a renderização,
  // sem useEffect): quando `valorInicial` muda — por ex. o valor ecoado
  // de volta pela action num erro de validação — a imagem acompanha,
  // não só o texto do seletor.
  const [selecionado, setSelecionado] = useState(valorInicial);
  const [ultimoValorSincronizado, setUltimoValorSincronizado] = useState(valorInicial);
  if (valorInicial !== ultimoValorSincronizado) {
    setUltimoValorSincronizado(valorInicial);
    setSelecionado(valorInicial);
  }

  const pecaSelecionada = opcoes.find((p) => p.id === selecionado);
  const capa = pecaSelecionada
    ? (pecaSelecionada.imagens.find((img) => img.isCapa) ?? pecaSelecionada.imagens[0])
    : undefined;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={`peca_${slot}`}>{rotulo}</Label>
      <div className="flex items-center gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-secondary">
          {capa && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={capa.url} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <Select
          name={`peca_${slot}`}
          defaultValue={valorInicial}
          onValueChange={(valor) => setSelecionado(String(valor))}
        >
          <SelectTrigger id={`peca_${slot}`} className="w-full">
            <SelectValue placeholder="Nenhuma">
              {(valor: string) => {
                const peca = opcoes.find((p) => p.id === valor);
                return peca ? `${peca.nome} (${peca.corValor})` : "Nenhuma";
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Nenhuma</SelectItem>
            {opcoes.map((peca) => (
              <SelectItem key={peca.id} value={peca.id}>
                {peca.nome} ({peca.corValor})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
