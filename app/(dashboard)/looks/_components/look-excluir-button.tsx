"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { excluirLook } from "../_actions/excluir-look";
import { Button } from "@/components/ui/button";

export function LookExcluirButton({ id, nome }: { id: string; nome: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm(`Excluir o look "${nome}"?`)) return;
        startTransition(async () => {
          const resultado = await excluirLook(id);
          if (resultado?.erro) {
            toast.error(resultado.erro);
          } else {
            router.push("/looks");
          }
        });
      }}
    >
      Excluir look
    </Button>
  );
}
