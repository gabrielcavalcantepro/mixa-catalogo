"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { gerarCandidatosAction } from "../_actions/gerar-candidatos";
import { Button } from "@/components/ui/button";

export function GerarCandidatosButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const resultado = await gerarCandidatosAction();
          if (resultado.gerados === 0) {
            toast("Nenhum candidato novo — o catálogo já foi todo combinado.");
          } else {
            toast.success(`${resultado.gerados} candidato(s) novo(s) gerado(s).`);
          }
          if (resultado.truncado) {
            toast("Catálogo grande demais pra combinar tudo de uma vez — geração parcial.");
          }
          router.refresh();
        });
      }}
    >
      {pending ? "Gerando..." : "Gerar candidatos"}
    </Button>
  );
}
