import { describe, expect, it } from "vitest";
import { calcularFingerprint } from "./calcular-fingerprint";

describe("calcularFingerprint", () => {
  it("é igual independente da ordem das chaves", () => {
    const a = calcularFingerprint({ calcado: "p1", parte_de_cima: "p2" });
    const b = calcularFingerprint({ parte_de_cima: "p2", calcado: "p1" });

    expect(a).toBe(b);
  });

  it("muda se a peça de algum slot muda", () => {
    const a = calcularFingerprint({ calcado: "p1", parte_de_cima: "p2" });
    const b = calcularFingerprint({ calcado: "p3", parte_de_cima: "p2" });

    expect(a).not.toBe(b);
  });

  it("muda se um slot a mais está presente", () => {
    const a = calcularFingerprint({ calcado: "p1" });
    const b = calcularFingerprint({ calcado: "p1", cinto: "p4" });

    expect(a).not.toBe(b);
  });
});
