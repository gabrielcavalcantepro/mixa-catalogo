import { notFound } from "next/navigation";
import { criarVariante } from "../../_actions/criar-variante";
import { buscarLook } from "../../_queries/buscar-look";
import { listarOpcoesFormulario } from "../../_queries/opcoes-formulario";
import { LookForm } from "../../_components/look-form";

export default async function CriarVariantePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [lookBase, opcoes] = await Promise.all([buscarLook(id), listarOpcoesFormulario()]);
  if (!lookBase) notFound();

  const valoresIniciais = {
    nome: lookBase.nome,
    ocasiao: lookBase.ocasioes.map((o) => o.ocasiao),
    perfilEstiloIds: lookBase.perfisEstilo.map((p) => p.perfilEstiloId),
    pecasPorSlot: Object.fromEntries(lookBase.pecas.map((lp) => [lp.slot, lp.pecaId])),
  };

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl">Criar variante</h1>
      <p className="mb-8 text-muted-foreground">
        Partindo de &ldquo;{lookBase.nome ?? `Look #${lookBase.id.slice(0, 8)}`}
        &rdquo;. Troque a(s) peça(s) que mudam a ocasião (ex.: cinto e sapato) e
        ajuste ocasião/perfis — o slot trocado é calculado automaticamente pela
        diferença em relação ao look-base.
      </p>
      <LookForm
        action={criarVariante.bind(null, id)}
        opcoes={opcoes}
        valoresIniciais={valoresIniciais}
        textoBotao="Criar variante"
      />
    </div>
  );
}
