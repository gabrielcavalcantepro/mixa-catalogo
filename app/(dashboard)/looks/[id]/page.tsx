import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buscarLook } from "../_queries/buscar-look";
import { LookGridColagem } from "../_components/look-grid-colagem";
import { LookExcluirButton } from "../_components/look-excluir-button";
import { OCASIAO_LABELS, PESO_CLIMA_LABELS, SLOT_LABELS } from "../_lib/schema";

export default async function LookDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const look = await buscarLook(id);
  if (!look) notFound();

  const nomeExibicao = look.nome ?? `Look #${look.id.slice(0, 8)}`;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl">{nomeExibicao}</h1>
          <p className="text-muted-foreground">Cápsula: {look.capsula.nome}</p>
          <p className="text-muted-foreground">
            Clima:{" "}
            {look.climaMisto ? (
              <Badge variant="destructive">Misto</Badge>
            ) : look.climas.length > 0 ? (
              look.climas
                .map((c) => PESO_CLIMA_LABELS[c.pesoClima as keyof typeof PESO_CLIMA_LABELS])
                .join(", ")
            ) : (
              "—"
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href={`/looks/${id}/editar`}>Editar</Link>}
          />
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href={`/looks/${id}/variante`}>Criar variante</Link>}
          />
          <LookExcluirButton id={look.id} nome={nomeExibicao} />
        </div>
      </div>

      {look.varianteDe && (
        <p className="text-sm text-muted-foreground">
          Variante de{" "}
          <Link href={`/looks/${look.varianteDe.id}`} className="underline">
            {look.varianteDe.nome ?? `Look #${look.varianteDe.id.slice(0, 8)}`}
          </Link>{" "}
          — trocou:{" "}
          {look.slotsTrocados
            .map((s) => SLOT_LABELS[s.slot as keyof typeof SLOT_LABELS])
            .join(", ")}
        </p>
      )}

      <LookGridColagem pecas={look.pecas} />

      <div className="flex flex-wrap gap-2">
        {look.ocasioes.map((o) => (
          <Badge key={o.ocasiao}>{OCASIAO_LABELS[o.ocasiao as keyof typeof OCASIAO_LABELS]}</Badge>
        ))}
        {look.perfisEstilo.map((p) => (
          <Badge key={p.perfilEstiloId} variant="outline">
            {p.perfilEstilo.nome}
          </Badge>
        ))}
      </div>

      {look.variantes.length > 0 && (
        <div>
          <h2 className="mb-2 text-lg">Variantes deste look</h2>
          <ul className="flex flex-col gap-1">
            {look.variantes.map((variante) => (
              <li key={variante.id}>
                <Link href={`/looks/${variante.id}`} className="text-sm underline">
                  {variante.nome ?? `Look #${variante.id.slice(0, 8)}`}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
