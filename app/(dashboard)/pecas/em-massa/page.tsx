import { listarOpcoesFormulario } from "../_queries/opcoes-formulario";
import { CadastroEmMassa } from "./_components/cadastro-em-massa";

export default async function CadastroEmMassaPage() {
  const opcoes = await listarOpcoesFormulario();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-8 text-3xl">Cadastrar peças em massa</h1>
      <CadastroEmMassa opcoes={opcoes} />
    </div>
  );
}
