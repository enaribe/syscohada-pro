import { prisma } from '@/server/db/prisma'
import type { TBalance } from '@/types/syscohada'
import { PLAN_COMPTABLE } from './plan-comptable'

export async function calculerBalance(tenantId: string, exerciceId: string): Promise<TBalance[]> {
  const lignes = await prisma.ligneEcriture.findMany({
    where: {
      tenantId,
      ecriture: {
        exerciceId,
        deletedAt: null,
      },
    },
    select: {
      compte: true,
      debit: true,
      credit: true,
    },
  })

  const compteMap = new Map<string, { totalDebit: number; totalCredit: number }>()

  for (const ligne of lignes) {
    const existing = compteMap.get(ligne.compte) ?? { totalDebit: 0, totalCredit: 0 }
    existing.totalDebit += Number(ligne.debit)
    existing.totalCredit += Number(ligne.credit)
    compteMap.set(ligne.compte, existing)
  }

  const balance: TBalance[] = []
  for (const [compte, totaux] of compteMap) {
    const solde = totaux.totalDebit - totaux.totalCredit
    balance.push({
      compte,
      intitule: PLAN_COMPTABLE[compte] ?? compte,
      totalDebit: totaux.totalDebit,
      totalCredit: totaux.totalCredit,
      soldeDebit: solde > 0 ? solde : 0,
      soldeCredit: solde < 0 ? Math.abs(solde) : 0,
    })
  }

  return balance.sort((a, b) => a.compte.localeCompare(b.compte))
}
