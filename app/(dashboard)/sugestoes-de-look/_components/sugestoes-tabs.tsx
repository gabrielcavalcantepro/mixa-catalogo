"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CandidatoCard } from "./candidato-card";
import { CandidatoReabrirButton } from "./candidato-reabrir-button";
import { CandidatoReprovarButton } from "./candidato-reprovar-button";
import type {
  listarCandidatosPendentes,
  listarCandidatosReprovados,
} from "../_queries/listar-candidatos";

type Pendentes = Awaited<ReturnType<typeof listarCandidatosPendentes>>;
type Reprovados = Awaited<ReturnType<typeof listarCandidatosReprovados>>;

export function SugestoesTabs({
  pendentes,
  reprovados,
}: {
  pendentes: Pendentes;
  reprovados: Reprovados;
}) {
  return (
    <Tabs defaultValue="pendentes">
      <TabsList>
        <TabsTrigger value="pendentes">Pendentes ({pendentes.length})</TabsTrigger>
        <TabsTrigger value="reprovados">Reprovados ({reprovados.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="pendentes">
        <div className="grid grid-cols-2 gap-4 pt-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {pendentes.map((candidato) => (
            <CandidatoCard
              key={candidato.id}
              candidato={candidato}
              acaoSecundaria={<CandidatoReprovarButton id={candidato.id} />}
            />
          ))}
          {pendentes.length === 0 && (
            <p className="col-span-full py-8 text-center text-muted-foreground">
              Nenhum candidato pendente. Clique em &ldquo;Gerar candidatos&rdquo; pra combinar
              as peças do catálogo.
            </p>
          )}
        </div>
      </TabsContent>

      <TabsContent value="reprovados">
        <div className="grid grid-cols-2 gap-4 pt-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {reprovados.map((candidato) => (
            <CandidatoCard
              key={candidato.id}
              candidato={candidato}
              acaoSecundaria={<CandidatoReabrirButton id={candidato.id} />}
            />
          ))}
          {reprovados.length === 0 && (
            <p className="col-span-full py-8 text-center text-muted-foreground">
              Nenhum candidato reprovado.
            </p>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
