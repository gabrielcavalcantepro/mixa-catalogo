"use client";

import { useState } from "react";
import { atualizarCapsula } from "../_actions/capsula-actions";
import { CapsulaForm } from "./capsula-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Capsula } from "@/db/schema";

export function CapsulaEditarDialog({ capsula }: { capsula: Capsula }) {
  const [aberto, setAberto] = useState(false);

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            Editar
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar cápsula</DialogTitle>
        </DialogHeader>
        <CapsulaForm
          action={atualizarCapsula.bind(null, capsula.id)}
          valoresIniciais={{
            nome: capsula.nome,
            dataLancamento: capsula.dataLancamento,
          }}
          textoBotao="Salvar alterações"
          aoSalvarComSucesso={() => setAberto(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
