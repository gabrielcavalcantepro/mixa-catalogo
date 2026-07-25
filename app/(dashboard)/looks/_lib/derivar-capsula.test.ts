import { describe, expect, it } from "vitest";
import { derivarCapsulaId } from "./derivar-capsula";

describe("derivarCapsulaId", () => {
  it("escolhe a cápsula com a peça de lançamento mais recente", () => {
    const resultado = derivarCapsulaId([
      { capsulaId: "capsula-antiga", dataLancamento: new Date("2025-06-01") },
      { capsulaId: "capsula-nova", dataLancamento: new Date("2026-01-15") },
    ]);

    expect(resultado).toBe("capsula-nova");
  });

  it("não depende da ordem das peças na lista", () => {
    const resultado = derivarCapsulaId([
      { capsulaId: "capsula-nova", dataLancamento: new Date("2026-01-15") },
      { capsulaId: "capsula-antiga", dataLancamento: new Date("2025-06-01") },
    ]);

    expect(resultado).toBe("capsula-nova");
  });

  it("funciona com uma única peça", () => {
    const resultado = derivarCapsulaId([
      { capsulaId: "unica", dataLancamento: new Date("2025-01-01") },
    ]);

    expect(resultado).toBe("unica");
  });

  it("lança erro se não houver peças", () => {
    expect(() => derivarCapsulaId([])).toThrow();
  });
});
