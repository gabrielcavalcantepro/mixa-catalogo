"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { reprovarCandidato } from "../_actions/reprovar-candidato";
import { Button } from "@/components/ui/button";

export function CandidatoReprovarButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm("Reprovar este candidato? Ele vai pra aba de reprovados.")) {
          return;
        }
        startTransition(async () => {
          await reprovarCandidato(id);
          toast.success("Candidato reprovado.");
        });
      }}
    >
      Reprovar
    </Button>
  );
}
