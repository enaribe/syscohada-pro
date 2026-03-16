import { z } from 'zod/v4'
import type { GrandLivreLigne } from '@/server/lib/syscohada/grand-livre'
import { getGrandLivre } from '@/server/lib/syscohada/grand-livre'
import { createTRPCRouter } from '../context'
import { exerciceProcedure } from '../middleware'

type GrandLivreResult = {
  compte: string
  intitule: string
  lignes: GrandLivreLigne[]
}

export const grandLivreRouter = createTRPCRouter({
  get: exerciceProcedure
    .input(
      z.object({
        compte: z.string().regex(/^\d{6}$/),
        dateDebut: z.string().optional(),
        dateFin: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }): Promise<GrandLivreResult> => {
      return getGrandLivre(
        ctx.entrepriseId,
        ctx.exerciceId,
        input.compte,
        input.dateDebut,
        input.dateFin,
      )
    }),
})
