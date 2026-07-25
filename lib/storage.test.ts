import { describe, expect, it } from "vitest";
import { extrairCaminhoDoBucket } from "./storage";

describe("extrairCaminhoDoBucket", () => {
  it("extrai o caminho de uma URL pública válida", () => {
    const url = "https://xyzcompany.supabase.co/storage/v1/object/public/pecas/pecas/123/abc.webp";
    expect(extrairCaminhoDoBucket(url, "pecas")).toBe("pecas/123/abc.webp");
  });

  it("retorna null se a URL não bate com o bucket esperado", () => {
    const url = "https://xyzcompany.supabase.co/storage/v1/object/public/outro-bucket/pecas/123/abc.webp";
    expect(extrairCaminhoDoBucket(url, "pecas")).toBeNull();
  });

  it("retorna null pra URL de outra origem (ex.: caminho relativo legado de /uploads)", () => {
    expect(extrairCaminhoDoBucket("/uploads/pecas/123/abc.webp", "pecas")).toBeNull();
  });
});
