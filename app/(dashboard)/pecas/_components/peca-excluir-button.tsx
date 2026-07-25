"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { excluirPeca } from "../_actions/excluir-peca";
import { Button } from "@/components/ui/button";

export function PecaExcluirButton({ id, nome }: { id: string; nome: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm(`Excluir a peça "${nome}"?`)) return;
        startTransition(async () => {
          const resultado = await excluirPeca(id);
          if (resultado?.erro) {
            toast.error(resultado.erro);
          } else {
            router.push("/pecas");
          }
        });
      }}
    >
      Excluir peça
    </Button>
  );
}
