import { notFound } from "next/navigation";
import { aprovarCandidato } from "../../_actions/aprovar-candidato";
import { buscarCandidato } from "../../_queries/buscar-candidato";
import { listarOpcoesFormulario } from "../../_queries/opcoes-formulario";
import { listarLooksExistentes } from "../../_queries/listar-looks-existentes";
import { AprovarCandidatoForm } from "../../_components/aprovar-candidato-form";

export default async function AprovarCandidatoPage({
  params,
}: {
  params: Promise<{ candidatoId: string }>;
}) {
  const { candidatoId } = await params;
  const [candidato, opcoes, looksExistentes] = await Promise.all([
    buscarCandidato(candidatoId),
    listarOpcoesFormulario(),
    listarLooksExistentes(),
  ]);
  if (!candidato) notFound();

  const valoresIniciais = {
    nome: null,
    ocasiao: candidato.ocasioesSugeridas.map((o) => o.ocasiao),
    perfilEstiloIds: candidato.perfisSugeridos.map((p) => p.perfilEstiloId),
    pecasPorSlot: Object.fromEntries(candidato.pecas.map((cp) => [cp.slot, cp.pecaId])),
    varianteDeId: "",
  };

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl">Revisar candidato</h1>
      <p className="mb-8 text-muted-foreground">
        Peças, clima e ocasião/perfil sugeridos vieram do motor de geração — ajuste o que
        quiser antes de aprovar. Ao aprovar, isso vira um look de verdade e some da fila.
      </p>
      <AprovarCandidatoForm
        action={aprovarCandidato.bind(null, candidatoId)}
        opcoes={opcoes}
        valoresIniciais={valoresIniciais}
        looksExistentes={looksExistentes}
      />
    </div>
  );
}
