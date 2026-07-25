import { inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  lookClimas,
  lookOcasioes,
  lookPecas,
  lookPerfisEstilo,
  lookSlotsTrocados,
  looks,
  pecas,
  type Look,
} from "@/db/schema";
import { derivarCapsulaId } from "../_lib/derivar-capsula";
import { derivarClimaLook } from "../_lib/derivar-clima";

/**
 * Helper privado da fatia de looks (não é Server Action própria — sem
 * "use server" aqui, só importado por quem já é). Centraliza "validar
 * peças existem + derivar cápsula/clima", reaproveitado por
 * criar-look.ts, atualizar-look.ts, criar-variante.ts e
 * aprovar-candidato.ts.
 */
export async function validarPecasEDerivar(
  pecasPorSlot: Record<string, string>,
): Promise<
  | { erro: string }
  | { capsulaId: string; clima: { climas: string[]; misto: boolean } }
> {
  const pecaIds = Object.values(pecasPorSlot);
  const pecasSelecionadas = await db.query.pecas.findMany({
    where: inArray(pecas.id, pecaIds),
    with: { capsula: true, pesosClima: true },
  });
  if (pecasSelecionadas.length !== pecaIds.length) {
    return { erro: "Uma ou mais peças selecionadas não foram encontradas." };
  }

  const capsulaId = derivarCapsulaId(
    pecasSelecionadas.map((p) => ({
      capsulaId: p.capsulaId,
      dataLancamento: p.capsula.dataLancamento,
    })),
  );
  const clima = derivarClimaLook(
    pecasSelecionadas.map((p) => ({
      slot: p.slot,
      climas: p.pesosClima.map((pc) => pc.pesoClima),
    })),
  );

  return { capsulaId, clima };
}

type DadosNovoLook = {
  nome: string | null;
  ocasiao: string[];
  perfilEstiloIds: string[];
  pecasPorSlot: Record<string, string>;
};

/**
 * Insere um look novo do zero (look + look_peca + look_ocasiao +
 * look_perfil_estilo + look_clima, e opcionalmente variante_de_id +
 * look_slot_trocado) numa única transação. Usado por criar-look.ts,
 * criar-variante.ts e aprovar-candidato.ts — NÃO por atualizar-look.ts,
 * que edita um look existente (update + delete/reinsert das junções).
 */
export async function inserirNovoLook(
  dados: DadosNovoLook,
  derivado: { capsulaId: string; clima: { climas: string[]; misto: boolean } },
  extra?: { varianteDeId?: string; slotsTrocados?: string[] },
): Promise<Look> {
  return db.transaction(async (tx) => {
    const [look] = await tx
      .insert(looks)
      .values({
        nome: dados.nome,
        capsulaId: derivado.capsulaId,
        climaMisto: derivado.clima.misto,
        varianteDeId: extra?.varianteDeId,
      })
      .returning();

    await Promise.all([
      tx.insert(lookPecas).values(
        Object.entries(dados.pecasPorSlot).map(([slot, pecaId]) => ({
          lookId: look.id,
          slot: slot as (typeof lookPecas.$inferInsert)["slot"],
          pecaId,
        })),
      ),
      tx.insert(lookOcasioes).values(
        dados.ocasiao.map((o) => ({
          lookId: look.id,
          ocasiao: o as (typeof lookOcasioes.$inferInsert)["ocasiao"],
        })),
      ),
      tx.insert(lookPerfisEstilo).values(
        dados.perfilEstiloIds.map((id) => ({ lookId: look.id, perfilEstiloId: id })),
      ),
      derivado.clima.climas.length > 0
        ? tx.insert(lookClimas).values(
            derivado.clima.climas.map((c) => ({
              lookId: look.id,
              pesoClima: c as (typeof lookClimas.$inferInsert)["pesoClima"],
            })),
          )
        : Promise.resolve(),
      extra?.slotsTrocados && extra.slotsTrocados.length > 0
        ? tx.insert(lookSlotsTrocados).values(
            extra.slotsTrocados.map((slot) => ({
              lookId: look.id,
              slot: slot as (typeof lookSlotsTrocados.$inferInsert)["slot"],
            })),
          )
        : Promise.resolve(),
    ]);

    return look;
  });
}
