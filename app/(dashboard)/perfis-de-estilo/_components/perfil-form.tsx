"use client";

import { useActionState, useEffect, useRef } from "react";
import type { PerfilActionState } from "../_actions/perfil-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  action: (
    estadoAnterior: PerfilActionState,
    formData: FormData,
  ) => Promise<PerfilActionState>;
  valoresIniciais?: { nome: string; descricao: string | null };
  textoBotao: string;
  aoSalvarComSucesso?: () => void;
};

export function PerfilForm({
  action,
  valoresIniciais,
  textoBotao,
  aoSalvarComSucesso,
}: Props) {
  const [estado, formAction, pending] = useActionState(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const estavaPendente = useRef(false);

  useEffect(() => {
    if (estavaPendente.current && !pending && !estado?.erro) {
      formRef.current?.reset();
      aoSalvarComSucesso?.();
    }
    estavaPendente.current = pending;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado, pending]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="nome">Nome</Label>
        <Input
          id="nome"
          name="nome"
          required
          defaultValue={valoresIniciais?.nome}
          placeholder="Ex.: Clássica"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="descricao">Descrição (opcional)</Label>
        <Textarea
          id="descricao"
          name="descricao"
          defaultValue={valoresIniciais?.descricao ?? ""}
          rows={3}
        />
      </div>
      {estado?.erro && <p className="text-sm text-destructive">{estado.erro}</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Salvando..." : textoBotao}
      </Button>
    </form>
  );
}
