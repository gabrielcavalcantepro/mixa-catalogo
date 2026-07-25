"use client";

import type { PerfilEstilo } from "@/db/schema";
import type { LookActionState, LookValoresFormulario } from "../_lib/schema";
import { LookForm } from "./look-form";
import { VarianteDeSeletor, type LookOpcao } from "./variante-de-seletor";
import type { PecaOpcaoComImagem } from "./seletor-peca-do-slot";

/**
 * Combina `LookForm` com o seletor de "é variante de" — precisa ser um
 * Client Component porque `camposExtras` é uma função, e função não
 * serializa de Server Component pra Client Component (a página que usa
 * isso é Server Component; ela só passa dados simples pra cá).
 */
export function AprovarCandidatoForm({
  action,
  opcoes,
  valoresIniciais,
  looksExistentes,
}: {
  action: (
    estadoAnterior: LookActionState,
    formData: FormData,
  ) => Promise<LookActionState>;
  opcoes: { pecas: (PecaOpcaoComImagem & { slot: string })[]; perfis: PerfilEstilo[] };
  valoresIniciais: LookValoresFormulario;
  looksExistentes: LookOpcao[];
}) {
  return (
    <LookForm
      action={action}
      opcoes={opcoes}
      valoresIniciais={valoresIniciais}
      textoBotao="Aprovar e criar look"
      camposExtras={(valoresAtuais) => (
        <VarianteDeSeletor looks={looksExistentes} valorInicial={valoresAtuais?.varianteDeId ?? ""} />
      )}
    />
  );
}
