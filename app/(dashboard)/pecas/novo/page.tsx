import { criarPeca } from "../_actions/criar-peca";
import { listarOpcoesFormulario } from "../_queries/opcoes-formulario";
import { PecaForm } from "../_components/peca-form";

export default async function NovaPecaPage() {
  const opcoes = await listarOpcoesFormulario();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-8 text-3xl">Nova peça</h1>
      <PecaForm action={criarPeca} opcoes={opcoes} textoBotao="Criar peça" />
    </div>
  );
}
