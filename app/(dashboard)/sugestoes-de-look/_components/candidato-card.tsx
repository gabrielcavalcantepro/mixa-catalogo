import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { OCASIAO_LABELS, PESO_CLIMA_LABELS } from "../_lib/labels";
import type { listarCandidatosPendentes } from "../_queries/listar-candidatos";

type Candidato = Awaited<ReturnType<typeof listarCandidatosPendentes>>[number];

export function CandidatoCard({
  candidato,
  acaoSecundaria,
}: {
  candidato: Candidato;
  acaoSecundaria: ReactNode;
}) {
  const capas = candidato.pecas
    .map((cp) => cp.peca.imagens.find((img) => img.isCapa) ?? cp.peca.imagens[0])
    .filter((img): img is NonNullable<typeof img> => !!img)
    .slice(0, 4);

  return (
    <Card className="gap-3 p-3">
      <div className="grid aspect-square grid-cols-2 gap-1 overflow-hidden rounded-md bg-secondary">
        {capas.map((img, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={img.url} alt="" className="h-full w-full object-cover" />
        ))}
      </div>
      <div className="flex flex-col gap-1 px-1">
        <p className="text-xs text-muted-foreground">{candidato.pecas.length} peça(s)</p>
        <div className="flex flex-wrap gap-1 pt-1">
          {candidato.climas.map((c) => (
            <Badge key={c.pesoClima} variant="secondary">
              {PESO_CLIMA_LABELS[c.pesoClima as keyof typeof PESO_CLIMA_LABELS]}
            </Badge>
          ))}
          {candidato.ocasioesSugeridas.map((o) => (
            <Badge key={o.ocasiao} variant="outline">
              {OCASIAO_LABELS[o.ocasiao as keyof typeof OCASIAO_LABELS]}
            </Badge>
          ))}
          {candidato.perfisSugeridos.map((p) => (
            <Badge key={p.perfilEstiloId} variant="outline">
              {p.perfilEstilo.nome}
            </Badge>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 px-1 pt-1">
        <Button
          size="sm"
          nativeButton={false}
          render={<Link href={`/looks/a-partir-de/${candidato.id}`}>Revisar e aprovar</Link>}
        />
        {acaoSecundaria}
      </div>
    </Card>
  );
}
