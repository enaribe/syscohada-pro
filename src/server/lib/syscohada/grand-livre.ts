import { prisma } from '@/server/db/prisma'
import { PLAN_COMPTABLE } from './plan-comptable'

export type GrandLivreLigne = {
  date: Date
  piece: string | null
  libelle: string
  debit: number
  credit: number
  solde: number
}

export async function getGrandLivre(
  tenantId: string,
  exerciceId: string,
  compte: string,
  dateDebut?: string,
  dateFin?: string,
): Promise<{ compte: string; intitule: string; lignes: GrandLivreLigne[] }> {
  const dateFilter: Record<string, Date> = {}
  if (dateDebut) dateFilter.gte = new Date(dateDebut)
  if (dateFin) dateFilter.lte = new Date(dateFin)

  const ecritures = await prisma.ecriture.findMany({
    where: {
      tenantId,
      exerciceId,
      deletedAt: null,
      lignes: { some: { compte } },
      ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
    },
    include: { lignes: { where: { compte } } },
    orderBy: { date: 'asc' },
  })

  let solde = 0
  const lignes: GrandLivreLigne[] = []

  for (const ecriture of ecritures) {
    for (const ligne of ecriture.lignes) {
      const debit = Number(ligne.debit)
      const credit = Number(ligne.credit)
      solde += debit - credit
      lignes.push({
        date: ecriture.date,
        piece: ecriture.piece,
        libelle: ecriture.libelle,
        debit,
        credit,
        solde,
      })
    }
  }

  return {
    compte,
    intitule: PLAN_COMPTABLE[compte] ?? compte,
    lignes,
  }
}
