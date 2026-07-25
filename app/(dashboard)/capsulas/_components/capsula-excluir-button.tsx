"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { excluirCapsula } from "../_actions/capsula-actions";
import { Button } from "@/components/ui/button";

export function CapsulaExcluirButton({ id, nome }: { id: string; nome: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm(`Excluir a cápsula "${nome}"?`)) return;
        startTransition(async () => {
          const resultado = await excluirCapsula(id);
          if (resultado?.erro) {
            toast.error(resultado.erro);
          }
        });
      }}
    >
      Excluir
    </Button>
  );
}
