import { z } from 'zod/v4'
import { createTRPCRouter } from '../context'
import { roleGuard } from '../middleware'

type EntrepriseResult = {
  id: string
  raisonSociale: string
  slug: string
  formeJuridique: string | null
  ninea: string | null
  rccm: string | null
  secteur: string | null
  adresse: string | null
  ville: string | null
  pays: string
  zone: string
  plan: string
  createdAt: Date
}

export const entrepriseRouter = createTRPCRouter({
  get: roleGuard(['ADMIN', 'EXPERT', 'COMPTABLE', 'AUDITEUR', 'DIRIGEANT', 'COMMISSAIRE']).query(
    async ({ ctx }): Promise<EntrepriseResult | null> => {
      return ctx.rawDb.tenant.findUnique({ where: { id: ctx.entrepriseId } })
    },
  ),

  update: roleGuard(['ADMIN'])
    .input(
      z.object({
        raisonSociale: z.string().min(3).optional(),
        formeJuridique: z.string().optional(),
        ninea: z.string().optional(),
        rccm: z.string().optional(),
        secteur: z.string().optional(),
        adresse: z.string().optional(),
        ville: z.string().optional(),
        pays: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }): Promise<EntrepriseResult> => {
      const data: Record<string, string> = {}
      if (input.raisonSociale) data.raisonSociale = input.raisonSociale
      if (input.formeJuridique) data.formeJuridique = input.formeJuridique
      if (input.ninea) data.ninea = input.ninea
      if (input.rccm) data.rccm = input.rccm
      if (input.secteur) data.secteur = input.secteur
      if (input.adresse) data.adresse = input.adresse
      if (input.ville) data.ville = input.ville
      if (input.pays) data.pays = input.pays

      return ctx.rawDb.tenant.update({
        where: { id: ctx.entrepriseId },
        data,
      })
    }),
})
