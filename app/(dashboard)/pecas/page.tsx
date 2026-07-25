import Link from "next/link";
import { Button } from "@/components/ui/button";
import { listarPecas, type FiltrosPeca } from "./_queries/listar-pecas";
import { listarOpcoesFormulario } from "./_queries/opcoes-formulario";
import { PecaCard } from "./_components/peca-card";
import { PecaFiltros } from "./_components/peca-filtros";

type SearchParamsPecas = Record<string, string | string[] | undefined>;

function umValor(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function todosValores(v: string | string[] | undefined): string[] | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v : [v];
}

export default async function PecasPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsPecas>;
}) {
  const params = await searchParams;
  const filtros: FiltrosPeca = {
    busca: umValor(params.busca),
    slot: umValor(params.slot),
    corTipo: umValor(params.corTipo),
    pecaChave: umValor(params.pecaChave),
    capsulaId: umValor(params.capsulaId),
    perfilEstiloId: umValor(params.perfilEstiloId),
    ocasiaoBase: umValor(params.ocasiaoBase),
    pesoClima: todosValores(params.pesoClima),
  };

  const [pecas, opcoes] = await Promise.all([
    listarPecas(filtros),
    listarOpcoesFormulario(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Catálogo de peças</h1>
          <p className="text-muted-foreground">{pecas.length} peça(s)</p>
        </div>
        <Button nativeButton={false} render={<Link href="/pecas/novo">Nova peça</Link>} />
      </div>

      <PecaFiltros capsulas={opcoes.capsulas} perfis={opcoes.perfis} valoresAtuais={filtros} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {pecas.map((peca) => (
          <PecaCard key={peca.id} peca={peca} />
        ))}
        {pecas.length === 0 && (
          <p className="col-span-full py-8 text-center text-muted-foreground">
            Nenhuma peça encontrada com esses filtros.
          </p>
        )}
      </div>
    </div>
  );
}
