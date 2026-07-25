"use client";

import { useState } from "react";
import { atualizarPerfil } from "../_actions/perfil-actions";
import { PerfilForm } from "./perfil-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { PerfilEstilo } from "@/db/schema";

export function PerfilEditarDialog({ perfil }: { perfil: PerfilEstilo }) {
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
          <DialogTitle>Editar perfil de estilo</DialogTitle>
        </DialogHeader>
        <PerfilForm
          action={atualizarPerfil.bind(null, perfil.id)}
          valoresIniciais={{ nome: perfil.nome, descricao: perfil.descricao }}
          textoBotao="Salvar alterações"
          aoSalvarComSucesso={() => setAberto(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
