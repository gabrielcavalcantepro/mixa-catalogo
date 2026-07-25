import { describe, expect, it } from "vitest";
import { verificarAutenticacao } from "./autenticar";

function requisicaoCom(header?: string) {
  const headers = new Headers();
  if (header !== undefined) headers.set("authorization", header);
  return new Request("http://localhost/api/v1/looks", { headers });
}

describe("verificarAutenticacao", () => {
  it("deixa passar (retorna null) com o token certo", () => {
    const resultado = verificarAutenticacao(requisicaoCom("Bearer abc123"), "abc123");
    expect(resultado).toBeNull();
  });

  it("rejeita com 401 quando o token está errado", async () => {
    const resultado = verificarAutenticacao(requisicaoCom("Bearer errado"), "abc123");
    expect(resultado?.status).toBe(401);
  });

  it("rejeita com 401 quando não há header nenhum", () => {
    const resultado = verificarAutenticacao(requisicaoCom(undefined), "abc123");
    expect(resultado?.status).toBe(401);
  });

  it("rejeita com 401 quando o esquema não é Bearer", () => {
    const resultado = verificarAutenticacao(requisicaoCom("Basic abc123"), "abc123");
    expect(resultado?.status).toBe(401);
  });

  it("rejeita com 401 quando o token tem tamanho diferente do esperado", () => {
    const resultado = verificarAutenticacao(requisicaoCom("Bearer curto"), "abc123");
    expect(resultado?.status).toBe(401);
  });

  it("responde 500 quando a API não tem token configurado", () => {
    const resultado = verificarAutenticacao(requisicaoCom("Bearer qualquer"), undefined);
    expect(resultado?.status).toBe(500);
  });
});
