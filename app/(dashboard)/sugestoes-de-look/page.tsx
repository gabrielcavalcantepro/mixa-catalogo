import {
  listarCandidatosPendentes,
  listarCandidatosReprovados,
} from "./_queries/listar-candidatos";
import { SugestoesTabs } from "./_components/sugestoes-tabs";
import { GerarCandidatosButton } from "./_components/gerar-candidatos-button";

export default async function SugestoesDeLookPage() {
  const [pendentes, reprovados] = await Promise.all([
    listarCandidatosPendentes(),
    listarCandidatosReprovados(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Sugestões de look</h1>
          <p className="text-muted-foreground">
            {pendentes.length} candidato(s) pendente(s) — gerados por regra a partir do
            catálogo, não por IA.
          </p>
        </div>
        <GerarCandidatosButton />
      </div>

      <SugestoesTabs pendentes={pendentes} reprovados={reprovados} />
    </div>
  );
}
