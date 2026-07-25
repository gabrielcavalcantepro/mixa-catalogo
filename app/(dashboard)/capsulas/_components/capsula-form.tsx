"use client";

import { useActionState, useEffect, useRef } from "react";
import type { CapsulaActionState } from "../_actions/capsula-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function paraInputDate(data: Date) {
  return data.toISOString().slice(0, 10);
}

type Props = {
  action: (
    estadoAnterior: CapsulaActionState,
    formData: FormData,
  ) => Promise<CapsulaActionState>;
  valoresIniciais?: { nome: string; dataLancamento: Date };
  textoBotao: string;
  aoSalvarComSucesso?: () => void;
};

export function CapsulaForm({
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
          placeholder="Ex.: Verão 2026"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="dataLancamento">Data de lançamento</Label>
        <Input
          id="dataLancamento"
          name="dataLancamento"
          type="date"
          required
          defaultValue={
            valoresIniciais ? paraInputDate(valoresIniciais.dataLancamento) : undefined
          }
        />
      </div>
      {estado?.erro && <p className="text-sm text-destructive">{estado.erro}</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Salvando..." : textoBotao}
      </Button>
    </form>
  );
}
