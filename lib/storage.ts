import { randomUUID } from "crypto";
import path from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Abstração pequena de armazenamento de imagem — implementação atual
 * sobe pro Supabase Storage. Trocar de provedor depois é implementar
 * esta mesma interface de novo; as telas que a usam (pecas/_actions/
 * {criar,atualizar,excluir}-peca.ts) não mudam.
 */
export interface Storage {
  salvar(arquivo: File, pasta: string): Promise<string>;
  remover(url: string): Promise<void>;
}

function exigirEnv(nome: string): string {
  const valor = process.env[nome];
  if (!valor) {
    throw new Error(`${nome} não configurada — copie .env.example para .env`);
  }
  return valor;
}

/**
 * Pura, testada (lib/storage.test.ts) — extrai o caminho dentro do
 * bucket a partir da URL pública que fica salva em `peca_imagem.url`
 * (formato `.../storage/v1/object/public/<bucket>/<caminho>`).
 */
export function extrairCaminhoDoBucket(url: string, nomeDoBucket: string): string | null {
  const marcador = `/storage/v1/object/public/${nomeDoBucket}/`;
  const indice = url.indexOf(marcador);
  if (indice === -1) return null;
  return url.slice(indice + marcador.length);
}

let clienteSupabase: SupabaseClient | undefined;
let bucketConfigurado: string | undefined;

/**
 * Lazy de propósito: as env vars só são exigidas na 1ª operação de
 * storage de verdade, não no import do módulo — assim
 * `extrairCaminhoDoBucket` continua testável isoladamente, sem precisar
 * de Supabase configurado só pra rodar `npm test`. `service_role key`
 * ignora RLS e só pode rodar server-side — este módulo só é importado
 * por Server Actions, nunca deve ser importado por um Client Component
 * nem exposto como `NEXT_PUBLIC_*`.
 */
function obterClienteEBucket() {
  if (!clienteSupabase || !bucketConfigurado) {
    const supabaseUrl = exigirEnv("SUPABASE_URL");
    const supabaseServiceRoleKey = exigirEnv("SUPABASE_SERVICE_ROLE_KEY");
    bucketConfigurado = exigirEnv("SUPABASE_STORAGE_BUCKET");
    clienteSupabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  }
  return { supabase: clienteSupabase, bucket: bucketConfigurado };
}

class SupabaseStorage implements Storage {
  async salvar(arquivo: File, pasta: string): Promise<string> {
    const { supabase, bucket } = obterClienteEBucket();
    const extensao = path.extname(arquivo.name) || "";
    const caminho = `${pasta}/${randomUUID()}${extensao}`;

    const { error } = await supabase.storage.from(bucket).upload(caminho, arquivo, {
      contentType: arquivo.type || undefined,
    });
    if (error) {
      throw new Error(`Falha ao subir imagem pro Supabase Storage: ${error.message}`);
    }

    return supabase.storage.from(bucket).getPublicUrl(caminho).data.publicUrl;
  }

  async remover(url: string): Promise<void> {
    const { supabase, bucket } = obterClienteEBucket();
    const caminho = extrairCaminhoDoBucket(url, bucket);
    if (!caminho) return;
    await supabase.storage.from(bucket).remove([caminho]);
  }
}

export const storage: Storage = new SupabaseStorage();
