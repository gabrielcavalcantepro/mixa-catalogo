import OpenAI from "openai";

/** Lazy de propósito (mesmo padrão de lib/storage.ts). */
let cliente: OpenAI | undefined;

export function obterClienteOpenAI(): OpenAI {
  if (!cliente) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY não configurada — copie .env.example para .env");
    }
    cliente = new OpenAI({ apiKey });
  }
  return cliente;
}
