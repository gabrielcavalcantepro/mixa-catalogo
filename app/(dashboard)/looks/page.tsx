import Link from "next/link";
import { Button } from "@/components/ui/button";
import { listarLooks, type FiltrosLook } from "./_queries/listar-looks";
import { listarCapsulasReferencia } from "./_queries/listar-capsulas-referencia";
import { listarOpcoesFormulario } from "./_queries/opcoes-formulario";
import { LookCard } from "./_components/look-card";
import { LookFiltros } from "./_components/look-filtros";

type SearchParamsLooks = Record<string, string | string[] | undefined>;

function umValor(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function LooksPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsLooks>;
}) {
  const params = await searchParams;
  const filtros: FiltrosLook = {
    busca: umValor(params.busca),
    capsulaId: umValor(params.capsulaId),
    perfilEstiloId: umValor(params.perfilEstiloId),
    ocasiao: umValor(params.ocasiao),
    variante: umValor(params.variante),
  };

  const [looks, capsulas, opcoes] = await Promise.all([
    listarLooks(filtros),
    listarCapsulasReferencia(),
    listarOpcoesFormulario(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Curadoria de looks</h1>
          <p className="text-muted-foreground">{looks.length} look(s)</p>
        </div>
        <Button nativeButton={false} render={<Link href="/looks/novo">Novo look</Link>} />
      </div>

      <LookFiltros capsulas={capsulas} perfis={opcoes.perfis} valoresAtuais={filtros} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {looks.map((look) => (
          <LookCard key={look.id} look={look} />
        ))}
        {looks.length === 0 && (
          <p className="col-span-full py-8 text-center text-muted-foreground">
            Nenhum look encontrado com esses filtros.
          </p>
        )}
      </div>
    </div>
  );
}
