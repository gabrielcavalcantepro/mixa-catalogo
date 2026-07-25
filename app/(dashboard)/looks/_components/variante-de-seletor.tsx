import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type LookOpcao = {
  id: string;
  nome: string | null;
  capas: string[];
};

function nomeExibicao(look: { id: string; nome: string | null }) {
  return look.nome ?? `Look #${look.id.slice(0, 8)}`;
}

/**
 * Seletor manual do look-base — sem sugestão automática de parentesco.
 * Mostra uma mini-colagem (não só o nome) pra dar pra reconhecer
 * visualmente qual look é qual. Usado só no fluxo de aprovar candidato
 * (via `camposExtras` do `LookForm`).
 */
export function VarianteDeSeletor({
  looks,
  valorInicial,
}: {
  looks: LookOpcao[];
  valorInicial: string;
}) {
  return (
    <div className="flex flex-col gap-2 sm:max-w-md">
      <Label htmlFor="varianteDeId">É variante de (opcional)</Label>
      <Select name="varianteDeId" defaultValue={valorInicial}>
        <SelectTrigger id="varianteDeId" className="w-full">
          <SelectValue placeholder="Nenhum — look independente">
            {(valor: string) => {
              const look = looks.find((l) => l.id === valor);
              return look ? nomeExibicao(look) : "Nenhum — look independente";
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Nenhum — look independente</SelectItem>
          {looks.map((look) => (
            <SelectItem key={look.id} value={look.id}>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-11 shrink-0 gap-0.5 overflow-hidden rounded-sm bg-secondary">
                  {look.capas.map((url, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={url} alt="" className="h-full w-1/2 object-cover" />
                  ))}
                </div>
                <span>{nomeExibicao(look)}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
