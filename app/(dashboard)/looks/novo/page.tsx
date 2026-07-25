import { criarLook } from "../_actions/criar-look";
import { listarOpcoesFormulario } from "../_queries/opcoes-formulario";
import { LookForm } from "../_components/look-form";

export default async function NovoLookPage() {
  const opcoes = await listarOpcoesFormulario();

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-8 text-3xl">Novo look</h1>
      <LookForm action={criarLook} opcoes={opcoes} textoBotao="Criar look" />
    </div>
  );
}
