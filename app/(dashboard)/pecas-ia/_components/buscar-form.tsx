"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { PerfilEstilo } from "@/db/schema";
import { gerarCandidatosIaAction } from "../_actions/gerar-candidatos-ia";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function BuscarForm({ perfis }: { perfis: PerfilEstilo[] }) {
  const router = useRouter();
  const [perfilEstiloId, setPerfilEstiloId] = useState(perfis[0]?.id ?? "");
  const [pending, startTransition] = useTransition();

  function gerar() {
    if (!perfilEstiloId) return;
    startTransition(async () => {
      try {
        const resultado = await gerarCandidatosIaAction(perfilEstiloId);
        if (resultado.metaAtingida) {
          toast.success(
            `${resultado.pendentesNaFila} peça(s) na fila de revisão (${resultado.tentativas} tentativa(s), ${resultado.rejeitadasAuto} rejeitada(s) automaticamente).`,
          );
        } else if (resultado.tetoTentativasAtingido) {
          toast.warning(
            `Teto de ${resultado.tetoTentativas} tentativas atingido antes de completar a meta de 10: só ${resultado.pendentesNaFila} peça(s) chegaram na fila de revisão (${resultado.rejeitadasAuto} rejeitada(s) automaticamente).`,
          );
        } else if (resultado.paradaPorErroDeGeracao) {
          toast.warning(
            `Geração interrompida antes do teto de ${resultado.tetoTentativas} (erro ao tentar gerar mais peças) — ${resultado.pendentesNaFila} peça(s) na fila de revisão de ${resultado.tentativas} tentativa(s). Tente gerar de novo pra continuar.`,
          );
        } else {
          toast.warning(
            `${resultado.pendentesNaFila} peça(s) na fila de revisão de ${resultado.tentativas} tentativa(s) — meta de 10 não atingida.`,
          );
        }
        router.refresh();
      } catch (erro) {
        toast.error(erro instanceof Error ? erro.message : "Erro ao gerar candidatos.");
      }
    });
  }

  return (
    <div className="flex items-end gap-3">
      <div className="flex flex-col gap-1">
        <Label>Perfil de estilo</Label>
        <Select value={perfilEstiloId} onValueChange={(v) => setPerfilEstiloId(String(v))}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Escolha um estilo">
              {(valor: string) => perfis.find((p) => p.id === valor)?.nome}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {perfis.map((perfil) => (
              <SelectItem key={perfil.id} value={perfil.id}>
                {perfil.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="button" onClick={gerar} disabled={pending || !perfilEstiloId}>
        {pending ? "Gerando..." : "Gerar 10 peças"}
      </Button>
    </div>
  );
}
