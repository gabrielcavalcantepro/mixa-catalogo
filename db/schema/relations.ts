import { relations } from "drizzle-orm";
import { capsulas } from "./capsula";
import { perfisEstilo } from "./perfil-estilo";
import {
  pecaEstilo,
  pecaImagens,
  pecaOcasiaoBase,
  pecaPesoClima,
  pecas,
} from "./peca";
import {
  lookClimas,
  lookOcasioes,
  lookPecas,
  lookPerfisEstilo,
  lookSlotsTrocados,
  looks,
} from "./look";
import {
  lookCandidatoClimas,
  lookCandidatoOcasioesSugeridas,
  lookCandidatoPecas,
  lookCandidatoPerfisSugeridos,
  lookCandidatos,
} from "./look-candidato";
import {
  pecaCandidatoIaEstilo,
  pecaCandidatoIaOcasiaoBase,
  pecaCandidatoIaPesoClima,
  pecaCandidatosIa,
} from "./peca-candidato-ia";

export const capsulasRelations = relations(capsulas, ({ many }) => ({
  pecas: many(pecas),
  looks: many(looks),
}));

export const perfisEstiloRelations = relations(perfisEstilo, ({ many }) => ({
  pecaEstilo: many(pecaEstilo),
  lookPerfisEstilo: many(lookPerfisEstilo),
  pecaCandidatoIaEstilo: many(pecaCandidatoIaEstilo),
}));

export const pecasRelations = relations(pecas, ({ one, many }) => ({
  capsula: one(capsulas, {
    fields: [pecas.capsulaId],
    references: [capsulas.id],
  }),
  imagens: many(pecaImagens),
  pesosClima: many(pecaPesoClima),
  estilos: many(pecaEstilo),
  ocasioesBase: many(pecaOcasiaoBase),
  lookPecas: many(lookPecas),
}));

export const pecaImagensRelations = relations(pecaImagens, ({ one }) => ({
  peca: one(pecas, { fields: [pecaImagens.pecaId], references: [pecas.id] }),
}));

export const pecaPesoClimaRelations = relations(pecaPesoClima, ({ one }) => ({
  peca: one(pecas, { fields: [pecaPesoClima.pecaId], references: [pecas.id] }),
}));

export const pecaEstiloRelations = relations(pecaEstilo, ({ one }) => ({
  peca: one(pecas, { fields: [pecaEstilo.pecaId], references: [pecas.id] }),
  perfilEstilo: one(perfisEstilo, {
    fields: [pecaEstilo.perfilEstiloId],
    references: [perfisEstilo.id],
  }),
}));

export const pecaOcasiaoBaseRelations = relations(pecaOcasiaoBase, ({ one }) => ({
  peca: one(pecas, {
    fields: [pecaOcasiaoBase.pecaId],
    references: [pecas.id],
  }),
}));

export const looksRelations = relations(looks, ({ one, many }) => ({
  capsula: one(capsulas, {
    fields: [looks.capsulaId],
    references: [capsulas.id],
  }),
  varianteDe: one(looks, {
    fields: [looks.varianteDeId],
    references: [looks.id],
    relationName: "variantes",
  }),
  variantes: many(looks, { relationName: "variantes" }),
  pecas: many(lookPecas),
  ocasioes: many(lookOcasioes),
  perfisEstilo: many(lookPerfisEstilo),
  slotsTrocados: many(lookSlotsTrocados),
  climas: many(lookClimas),
}));

export const lookPecasRelations = relations(lookPecas, ({ one }) => ({
  look: one(looks, { fields: [lookPecas.lookId], references: [looks.id] }),
  peca: one(pecas, { fields: [lookPecas.pecaId], references: [pecas.id] }),
}));

export const lookOcasioesRelations = relations(lookOcasioes, ({ one }) => ({
  look: one(looks, { fields: [lookOcasioes.lookId], references: [looks.id] }),
}));

export const lookPerfisEstiloRelations = relations(lookPerfisEstilo, ({ one }) => ({
  look: one(looks, { fields: [lookPerfisEstilo.lookId], references: [looks.id] }),
  perfilEstilo: one(perfisEstilo, {
    fields: [lookPerfisEstilo.perfilEstiloId],
    references: [perfisEstilo.id],
  }),
}));

export const lookSlotsTrocadosRelations = relations(lookSlotsTrocados, ({ one }) => ({
  look: one(looks, {
    fields: [lookSlotsTrocados.lookId],
    references: [looks.id],
  }),
}));

export const lookClimasRelations = relations(lookClimas, ({ one }) => ({
  look: one(looks, { fields: [lookClimas.lookId], references: [looks.id] }),
}));

export const lookCandidatosRelations = relations(lookCandidatos, ({ many }) => ({
  pecas: many(lookCandidatoPecas),
  climas: many(lookCandidatoClimas),
  ocasioesSugeridas: many(lookCandidatoOcasioesSugeridas),
  perfisSugeridos: many(lookCandidatoPerfisSugeridos),
}));

export const lookCandidatoPecasRelations = relations(lookCandidatoPecas, ({ one }) => ({
  candidato: one(lookCandidatos, {
    fields: [lookCandidatoPecas.candidatoId],
    references: [lookCandidatos.id],
  }),
  peca: one(pecas, { fields: [lookCandidatoPecas.pecaId], references: [pecas.id] }),
}));

export const lookCandidatoClimasRelations = relations(lookCandidatoClimas, ({ one }) => ({
  candidato: one(lookCandidatos, {
    fields: [lookCandidatoClimas.candidatoId],
    references: [lookCandidatos.id],
  }),
}));

export const lookCandidatoOcasioesSugeridasRelations = relations(
  lookCandidatoOcasioesSugeridas,
  ({ one }) => ({
    candidato: one(lookCandidatos, {
      fields: [lookCandidatoOcasioesSugeridas.candidatoId],
      references: [lookCandidatos.id],
    }),
  }),
);

export const lookCandidatoPerfisSugeridosRelations = relations(
  lookCandidatoPerfisSugeridos,
  ({ one }) => ({
    candidato: one(lookCandidatos, {
      fields: [lookCandidatoPerfisSugeridos.candidatoId],
      references: [lookCandidatos.id],
    }),
    perfilEstilo: one(perfisEstilo, {
      fields: [lookCandidatoPerfisSugeridos.perfilEstiloId],
      references: [perfisEstilo.id],
    }),
  }),
);

export const pecaCandidatosIaRelations = relations(pecaCandidatosIa, ({ one, many }) => ({
  perfilEstilo: one(perfisEstilo, {
    fields: [pecaCandidatosIa.perfilEstiloId],
    references: [perfisEstilo.id],
  }),
  capsula: one(capsulas, {
    fields: [pecaCandidatosIa.capsulaId],
    references: [capsulas.id],
  }),
  pecaResultante: one(pecas, {
    fields: [pecaCandidatosIa.pecaIdResultante],
    references: [pecas.id],
  }),
  pesosClima: many(pecaCandidatoIaPesoClima),
  ocasioesBase: many(pecaCandidatoIaOcasiaoBase),
  estilos: many(pecaCandidatoIaEstilo),
}));

export const pecaCandidatoIaPesoClimaRelations = relations(pecaCandidatoIaPesoClima, ({ one }) => ({
  candidato: one(pecaCandidatosIa, {
    fields: [pecaCandidatoIaPesoClima.candidatoId],
    references: [pecaCandidatosIa.id],
  }),
}));

export const pecaCandidatoIaOcasiaoBaseRelations = relations(
  pecaCandidatoIaOcasiaoBase,
  ({ one }) => ({
    candidato: one(pecaCandidatosIa, {
      fields: [pecaCandidatoIaOcasiaoBase.candidatoId],
      references: [pecaCandidatosIa.id],
    }),
  }),
);

export const pecaCandidatoIaEstiloRelations = relations(pecaCandidatoIaEstilo, ({ one }) => ({
  candidato: one(pecaCandidatosIa, {
    fields: [pecaCandidatoIaEstilo.candidatoId],
    references: [pecaCandidatosIa.id],
  }),
  perfilEstilo: one(perfisEstilo, {
    fields: [pecaCandidatoIaEstilo.perfilEstiloId],
    references: [perfisEstilo.id],
  }),
}));
