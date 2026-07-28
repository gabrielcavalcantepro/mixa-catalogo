"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Capsula, PerfilEstilo } from "@/db/schema";
import type { LinhaEstado } from "../../pecas/em-massa/_components/linha-revisao";
import { AbaBuscar } from "./aba-buscar";
import { HistoricoLista } from "./historico-lista";
import { ObservacaoForm } from "./observacao-form";
import type { listarHistoricoIa } from "../_queries/listar-candidatos";
import type { listarObservacoesIa } from "../_queries/listar-observacoes";

export function PecasIaTabs({
  perfis,
  capsulas,
  linhasIniciais,
  historico,
  observacoes,
}: {
  perfis: PerfilEstilo[];
  capsulas: Capsula[];
  linhasIniciais: LinhaEstado[];
  historico: Awaited<ReturnType<typeof listarHistoricoIa>>;
  observacoes: Awaited<ReturnType<typeof listarObservacoesIa>>;
}) {
  return (
    <Tabs defaultValue="buscar">
      <TabsList>
        <TabsTrigger value="buscar">Buscar</TabsTrigger>
        <TabsTrigger value="historico">Histórico ({historico.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="buscar" className="pt-4">
        <AbaBuscar perfis={perfis} capsulas={capsulas} linhasIniciais={linhasIniciais} />
      </TabsContent>

      <TabsContent value="historico" className="flex flex-col gap-6 pt-4">
        <ObservacaoForm observacoes={observacoes} />
        <HistoricoLista historico={historico} />
      </TabsContent>
    </Tabs>
  );
}
