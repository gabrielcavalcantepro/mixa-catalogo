"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { reabrirCandidato } from "../_actions/reabrir-candidato";
import { Button } from "@/components/ui/button";

export function CandidatoReabrirButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await reabrirCandidato(id);
          toast.success("Candidato reaberto — voltou pra fila de pendentes.");
        });
      }}
    >
      Reabrir
    </Button>
  );
}
