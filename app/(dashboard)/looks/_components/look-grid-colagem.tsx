import { SLOTS_EM_ORDEM, SLOT_LABELS } from "../_lib/schema";

type ItemColagem = {
  slot: string;
  peca: {
    nome: string;
    imagens: { url: string; isCapa: boolean }[];
  };
};

/** Grid/colagem das imagens das peças do look — não existe foto de modelo vestindo o look. */
export function LookGridColagem({ pecas }: { pecas: ItemColagem[] }) {
  const emOrdem = SLOTS_EM_ORDEM.map((slot) => pecas.find((p) => p.slot === slot)).filter(
    (p): p is ItemColagem => !!p,
  );

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {emOrdem.map((item) => {
        const capa = item.peca.imagens.find((img) => img.isCapa) ?? item.peca.imagens[0];
        return (
          <figure key={item.slot} className="flex flex-col gap-1">
            <div className="aspect-square overflow-hidden rounded-md bg-secondary">
              {capa && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={capa.url}
                  alt={item.peca.nome}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <figcaption className="text-xs text-muted-foreground">
              {SLOT_LABELS[item.slot as keyof typeof SLOT_LABELS]} · {item.peca.nome}
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}
