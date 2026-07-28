"use client";

import { useMemo } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Versão controlada do upload de imagem, pra usar dentro da lista de
 * revisão do cadastro em massa — diferente de
 * pecas/_components/peca-image-uploader.tsx (esse é não-controlado,
 * pensado pra um único `<form action>`; aqui cada linha guarda seus
 * próprios `File[]` no estado do componente pai, sem upload real até
 * confirmar o lote inteiro).
 */
export function ImagemUploaderLinha({
  arquivos,
  onChange,
}: {
  arquivos: File[];
  onChange: (arquivos: File[]) => void;
}) {
  const previews = useMemo(() => arquivos.map((a) => URL.createObjectURL(a)), [arquivos]);

  return (
    <div className="flex flex-col gap-2">
      <Label>Imagens</Label>
      {previews.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {previews.map((src, indice) => (
            <div
              key={src}
              className="relative h-16 w-16 overflow-hidden rounded-md border border-border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(arquivos.filter((_, i) => i !== indice))}
                className="absolute top-0.5 right-0.5 rounded-full bg-background/90 p-0.5"
                aria-label="Remover imagem"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <Input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => onChange(Array.from(e.target.files ?? []))}
      />
    </div>
  );
}
