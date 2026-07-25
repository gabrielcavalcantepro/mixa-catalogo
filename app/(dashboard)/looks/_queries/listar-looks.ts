import { and, eq, ilike, isNotNull, isNull, type SQL } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { looks, ocasiaoEnum } from "@/db/schema";

export type FiltrosLook = {
  busca?: string;
  capsulaId?: string;
  perfilEstiloId?: string;
  ocasiao?: string;
  variante?: string;
};

const uuidValido = (v?: string) => !!v && z.uuid().safeParse(v).success;

export async function listarLooks(filtros: FiltrosLook) {
  const condicoes: SQL[] = [];
  if (filtros.busca) condicoes.push(ilike(looks.nome, `%${filtros.busca}%`));
  if (uuidValido(filtros.capsulaId)) condicoes.push(eq(looks.capsulaId, filtros.capsulaId!));
  if (filtros.variante === "sim") condicoes.push(isNotNull(looks.varianteDeId));
  if (filtros.variante === "nao") condicoes.push(isNull(looks.varianteDeId));

  const resultado = await db.query.looks.findMany({
    where: condicoes.length > 0 ? and(...condicoes) : undefined,
    orderBy: (look, { desc }) => [desc(look.criadoEm)],
    with: {
      capsula: true,
      pecas: { with: { peca: { with: { imagens: true } } } },
      ocasioes: true,
      perfisEstilo: true,
    },
  });

  const ocasiaoValida =
    filtros.ocasiao && ocasiaoEnum.enumValues.includes(filtros.ocasiao as never)
      ? filtros.ocasiao
      : undefined;
  const perfilEstiloIdValido = uuidValido(filtros.perfilEstiloId)
    ? filtros.perfilEstiloId
    : undefined;

  return resultado.filter((look) => {
    if (ocasiaoValida && !look.ocasioes.some((o) => o.ocasiao === ocasiaoValida)) {
      return false;
    }
    if (
      perfilEstiloIdValido &&
      !look.perfisEstilo.some((p) => p.perfilEstiloId === perfilEstiloIdValido)
    ) {
      return false;
    }
    return true;
  });
}
