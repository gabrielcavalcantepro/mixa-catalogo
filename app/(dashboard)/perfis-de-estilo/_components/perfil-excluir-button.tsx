"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { excluirPerfil } from "../_actions/perfil-actions";
import { Button } from "@/components/ui/button";

export function PerfilExcluirButton({ id, nome }: { id: string; nome: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm(`Excluir o perfil "${nome}"?`)) return;
        startTransition(async () => {
          const resultado = await excluirPerfil(id);
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
