"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { desfazerAprovacaoAction } from "../_actions/desfazer-aprovacao";
import type { listarHistoricoIa } from "../_queries/listar-candidatos";

type Historico = Awaited<ReturnType<typeof listarHistoricoIa>>;

const STATUS_LABELS: Record<string, string> = {
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
  desfeito: "Desfeito",
};

const STATUS_VARIANTES: Record<string, "default" | "outline" | "destructive"> = {
  aprovado: "default",
  rejeitado: "destructive",
  desfeito: "outline",
};

export function HistoricoLista({ historico }: { historico: Historico }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function desfazer(candidatoId: string) {
    startTransition(async () => {
      const resultado = await desfazerAprovacaoAction(candidatoId);
      if (resultado.erro) {
        toast.error(resultado.erro);
      } else {
        toast.success("Aprovação desfeita — a peça foi apagada.");
        router.refresh();
      }
    });
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {historico.map((candidato) => (
        <div
          key={candidato.id}
          className="flex flex-col gap-2 rounded-lg border border-border p-3"
        >
          <div className="aspect-square overflow-hidden rounded-md bg-secondary">
            {candidato.imagemUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={candidato.imagemUrl} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <p className="truncate font-medium">{candidato.nome}</p>
          <p className="text-xs text-muted-foreground">{candidato.perfilEstilo.nome}</p>
          <Badge variant={STATUS_VARIANTES[candidato.status] ?? "outline"} className="self-start">
            {STATUS_LABELS[candidato.status] ?? candidato.status}
          </Badge>
          {candidato.motivoRejeicaoAutomatica && (
            <p className="text-xs text-muted-foreground">{candidato.motivoRejeicaoAutomatica}</p>
          )}
          {candidato.status === "aprovado" && (
            <Button
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => desfazer(candidato.id)}
            >
              Desfazer
            </Button>
          )}
        </div>
      ))}
      {historico.length === 0 && (
        <p className="col-span-full py-8 text-center text-muted-foreground">
          Nenhuma decisão ainda.
        </p>
      )}
    </div>
  );
}
