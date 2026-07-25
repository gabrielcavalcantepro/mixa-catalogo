import { notFound } from "next/navigation";
import { atualizarPeca } from "../_actions/atualizar-peca";
import { buscarPeca } from "../_queries/buscar-peca";
import { listarOpcoesFormulario } from "../_queries/opcoes-formulario";
import { PecaForm } from "../_components/peca-form";
import { PecaExcluirButton } from "../_components/peca-excluir-button";

export default async function EditarPecaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [peca, opcoes] = await Promise.all([buscarPeca(id), listarOpcoesFormulario()]);
  if (!peca) notFound();

  const valoresIniciais = {
    nome: peca.nome,
    slot: peca.slot,
    corTipo: peca.corTipo,
    corValor: peca.corValor,
    pecaChave: peca.pecaChave,
    capsulaId: peca.capsulaId,
    linkAfiliado: peca.linkAfiliado,
    pesoClima: peca.pesosClima.map((p) => p.pesoClima),
    perfilEstiloIds: peca.estilos.map((e) => e.perfilEstiloId),
    ocasiaoBase: peca.ocasioesBase.map((o) => o.ocasiao),
    imagens: peca.imagens
      .slice()
      .sort((a, b) => a.ordem - b.ordem)
      .map((img) => ({ id: img.id, url: img.url })),
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl">Editar peça</h1>
        <PecaExcluirButton id={peca.id} nome={peca.nome} />
      </div>
      <PecaForm
        action={atualizarPeca.bind(null, id)}
        opcoes={opcoes}
        valoresIniciais={valoresIniciais}
        textoBotao="Salvar alterações"
      />
    </div>
  );
}
