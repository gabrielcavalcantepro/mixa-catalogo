import { listarOpcoesFormulario } from "./_queries/opcoes-formulario";
import { listarCandidatosPendentesIa, listarHistoricoIa } from "./_queries/listar-candidatos";
import { listarObservacoesIa } from "./_queries/listar-observacoes";
import { mapearCandidatoParaLinha } from "./_lib/mapear-candidato-para-linha";
import { PecasIaTabs } from "./_components/pecas-ia-tabs";

export default async function PecasIaPage() {
  const [opcoes, pendentes, historico, observacoes] = await Promise.all([
    listarOpcoesFormulario(),
    listarCandidatosPendentesIa(),
    listarHistoricoIa(),
    listarObservacoesIa(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl">Peças por IA</h1>
        <p className="text-muted-foreground">
          Gera candidatos a peça pra um perfil de estilo — texto e imagem via IA, checagem de
          combinação por regra. Nada é aprovado sozinho.
        </p>
      </div>

      <PecasIaTabs
        perfis={opcoes.perfis}
        capsulas={opcoes.capsulas}
        linhasIniciais={pendentes.map(mapearCandidatoParaLinha)}
        historico={historico}
        observacoes={observacoes}
      />
    </div>
  );
}
