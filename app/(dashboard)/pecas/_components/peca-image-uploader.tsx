"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ImagemExistente = { id: string; url: string };

export function PecaImageUploader({
  imagensExistentes = [],
}: {
  imagensExistentes?: ImagemExistente[];
}) {
  const [mantidas, setMantidas] = useState(imagensExistentes);
  const [removidas, setRemovidas] = useState<string[]>([]);
  const [novasPreview, setNovasPreview] = useState<string[]>([]);

  return (
    <div className="flex flex-col gap-3">
      <Label>Imagens</Label>
      {(mantidas.length > 0 || novasPreview.length > 0) && (
        <div className="flex flex-wrap gap-3">
          {mantidas.map((img) => (
            <div
              key={img.id}
              className="relative h-24 w-24 overflow-hidden rounded-md border border-border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => {
                  setRemovidas((r) => [...r, img.id]);
                  setMantidas((m) => m.filter((i) => i.id !== img.id));
                }}
                className="absolute right-1 top-1 rounded-full bg-background/90 p-1"
                aria-label="Remover imagem"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {novasPreview.map((src) => (
            <div
              key={src}
              className="h-24 w-24 overflow-hidden rounded-md border border-dashed border-border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {removidas.map((id) => (
        <input key={id} type="hidden" name="imagensRemovidasIds" value={id} />
      ))}

      <Input
        type="file"
        name="imagens"
        accept="image/*"
        multiple
        onChange={(e) => {
          const arquivos = Array.from(e.target.files ?? []);
          setNovasPreview(arquivos.map((a) => URL.createObjectURL(a)));
        }}
      />
      <p className="text-xs text-muted-foreground">
        A primeira imagem da peça vira a capa usada no grid/colagem do look.
        Selecione todas as imagens novas de uma vez.
      </p>
    </div>
  );
}
