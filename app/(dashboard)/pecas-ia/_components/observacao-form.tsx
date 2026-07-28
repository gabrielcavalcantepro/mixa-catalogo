"use client";

import { useActionState } from "react";
import { salvarObservacaoAction, type SalvarObservacaoState } from "../_actions/salvar-observacao";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { listarObservacoesIa } from "../_queries/listar-observacoes";

type Observacoes = Awaited<ReturnType<typeof listarObservacoesIa>>;

/**
 * Anotação livre que entra como contexto na próxima geração (ver
 * `_lib/gerar-lista.ts`) — só as mais recentes, não o histórico
 * inteiro, pra não inflar o prompt com o tempo.
 */
export function ObservacaoForm({ observacoes }: { observacoes: Observacoes }) {
  const [estado, formAction, pending] = useActionState(
    salvarObservacaoAction,
    undefined as SalvarObservacaoState,
  );

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
      <h3 className="font-heading text-lg">Observações pra próxima busca</h3>
      <form action={formAction} className="flex flex-col gap-2">
        <Label htmlFor="texto">Nova observação</Label>
        <Textarea id="texto" name="texto" placeholder='Ex.: "essa cor não combina com a marca"' />
        {estado?.erro && <p className="text-sm text-destructive">{estado.erro}</p>}
        <Button type="submit" disabled={pending} className="self-start">
          {pending ? "Salvando..." : "Salvar observação"}
        </Button>
      </form>

      {observacoes.length > 0 && (
        <ul className="flex flex-col gap-2 text-sm">
          {observacoes.map((o) => (
            <li key={o.id} className="text-muted-foreground">
              {o.texto}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
