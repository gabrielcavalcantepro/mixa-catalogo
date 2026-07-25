import { and, eq, ilike, type SQL } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { corTipoEnum, ocasiaoEnum, pesoClimaEnum, pecas, slotEnum } from "@/db/schema";

export type FiltrosPeca = {
  busca?: string;
  slot?: string;
  corTipo?: string;
  pecaChave?: string;
  capsulaId?: string;
  pesoClima?: string[];
  perfilEstiloId?: string;
  ocasiaoBase?: string;
};

const uuidValido = (v?: string) => !!v && z.uuid().safeParse(v).success;

export async function listarPecas(filtros: FiltrosPeca) {
  const condicoes: SQL[] = [];
  if (filtros.busca) condicoes.push(ilike(pecas.nome, `%${filtros.busca}%`));
  if (filtros.slot && slotEnum.enumValues.includes(filtros.slot as never)) {
    condicoes.push(eq(pecas.slot, filtros.slot as (typeof slotEnum.enumValues)[number]));
  }
  if (filtros.corTipo && corTipoEnum.enumValues.includes(filtros.corTipo as never)) {
    condicoes.push(eq(pecas.corTipo, filtros.corTipo as (typeof corTipoEnum.enumValues)[number]));
  }
  if (filtros.pecaChave === "sim") condicoes.push(eq(pecas.pecaChave, true));
  if (filtros.pecaChave === "nao") condicoes.push(eq(pecas.pecaChave, false));
  if (uuidValido(filtros.capsulaId)) {
    condicoes.push(eq(pecas.capsulaId, filtros.capsulaId!));
  }

  const resultado = await db.query.pecas.findMany({
    where: condicoes.length > 0 ? and(...condicoes) : undefined,
    orderBy: (peca, { desc }) => [desc(peca.criadoEm)],
    with: {
      imagens: true,
      capsula: true,
      pesosClima: true,
      estilos: { with: { perfilEstilo: true } },
      ocasioesBase: true,
    },
  });

  const pesoClimaValidos = (filtros.pesoClima ?? []).filter((v) =>
    pesoClimaEnum.enumValues.includes(v as never),
  );
  const ocasiaoValida =
    filtros.ocasiaoBase && ocasiaoEnum.enumValues.includes(filtros.ocasiaoBase as never)
      ? filtros.ocasiaoBase
      : undefined;
  const perfilEstiloIdValido = uuidValido(filtros.perfilEstiloId)
    ? filtros.perfilEstiloId
    : undefined;

  return resultado.filter((peca) => {
    if (pesoClimaValidos.length > 0) {
      const valores = peca.pesosClima.map((p) => p.pesoClima);
      if (!pesoClimaValidos.some((v) => valores.includes(v as never))) return false;
    }
    if (perfilEstiloIdValido) {
      if (!peca.estilos.some((e) => e.perfilEstiloId === perfilEstiloIdValido)) return false;
    }
    if (ocasiaoValida) {
      if (!peca.ocasioesBase.some((o) => o.ocasiao === ocasiaoValida)) return false;
    }
    return true;
  });
}
