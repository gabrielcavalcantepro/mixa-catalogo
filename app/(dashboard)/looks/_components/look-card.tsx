import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { OCASIAO_LABELS } from "../_lib/schema";
import type { listarLooks } from "../_queries/listar-looks";

type Look = Awaited<ReturnType<typeof listarLooks>>[number];

export function LookCard({ look }: { look: Look }) {
  const capas = look.pecas
    .map((lp) => lp.peca.imagens.find((img) => img.isCapa) ?? lp.peca.imagens[0])
    .filter((img): img is NonNullable<typeof img> => !!img)
    .slice(0, 4);

  return (
    <Link href={`/looks/${look.id}`}>
      <Card className="h-full gap-3 p-3 transition-shadow hover:shadow-md">
        <div className="grid aspect-square grid-cols-2 gap-1 overflow-hidden rounded-md bg-secondary">
          {capas.map((img, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={img.url} alt="" className="h-full w-full object-cover" />
          ))}
        </div>
        <div className="flex flex-col gap-1 px-1">
          <p className="truncate font-medium">{look.nome ?? `Look #${look.id.slice(0, 8)}`}</p>
          <div className="flex flex-wrap gap-1 pt-1">
            {look.varianteDeId && <Badge variant="secondary">Variante</Badge>}
            {look.ocasioes.map((o) => (
              <Badge key={o.ocasiao} variant="outline">
                {OCASIAO_LABELS[o.ocasiao as keyof typeof OCASIAO_LABELS]}
              </Badge>
            ))}
          </div>
        </div>
      </Card>
    </Link>
  );
}
