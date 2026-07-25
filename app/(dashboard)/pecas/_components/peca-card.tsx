import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SLOT_LABELS } from "../_lib/schema";
import type { listarPecas } from "../_queries/listar-pecas";

type Peca = Awaited<ReturnType<typeof listarPecas>>[number];

export function PecaCard({ peca }: { peca: Peca }) {
  const capa = peca.imagens.find((img) => img.isCapa) ?? peca.imagens[0];

  return (
    <Link href={`/pecas/${peca.id}`}>
      <Card className="h-full gap-3 p-3 transition-shadow hover:shadow-md">
        <div className="aspect-square overflow-hidden rounded-md bg-secondary">
          {capa && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={capa.url} alt={peca.nome} className="h-full w-full object-cover" />
          )}
        </div>
        <div className="flex flex-col gap-1 px-1">
          <p className="truncate font-medium">{peca.nome}</p>
          <p className="text-xs text-muted-foreground">
            {SLOT_LABELS[peca.slot]} · {peca.corValor}
          </p>
          <div className="flex flex-wrap gap-1 pt-1">
            {peca.pecaChave && <Badge variant="secondary">Peça-chave</Badge>}
            <Badge variant="outline">{peca.capsula.nome}</Badge>
          </div>
        </div>
      </Card>
    </Link>
  );
}
