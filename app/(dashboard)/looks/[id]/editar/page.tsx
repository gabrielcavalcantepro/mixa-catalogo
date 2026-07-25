import { notFound } from "next/navigation";
import { atualizarLook } from "../../_actions/atualizar-look";
import { buscarLook } from "../../_queries/buscar-look";
import { listarOpcoesFormulario } from "../../_queries/opcoes-formulario";
import { LookForm } from "../../_components/look-form";

export default async function EditarLookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [look, opcoes] = await Promise.all([buscarLook(id), listarOpcoesFormulario()]);
  if (!look) notFound();

  const valoresIniciais = {
    nome: look.nome,
    ocasiao: look.ocasioes.map((o) => o.ocasiao),
    perfilEstiloIds: look.perfisEstilo.map((p) => p.perfilEstiloId),
    pecasPorSlot: Object.fromEntries(look.pecas.map((lp) => [lp.slot, lp.pecaId])),
  };

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-8 text-3xl">Editar look</h1>
      <LookForm
        action={atualizarLook.bind(null, id)}
        opcoes={opcoes}
        valoresIniciais={valoresIniciais}
        textoBotao="Salvar alterações"
      />
    </div>
  );
}
