import type { TLigne } from '@/types/syscohada'

const TOLERANCE = 0.01

export function validerEquilibre(lignes: TLigne[]): { valid: boolean; diff: number } {
  const totalDebit = lignes.reduce((sum, l) => sum + l.debit, 0)
  const totalCredit = lignes.reduce((sum, l) => sum + l.credit, 0)
  const diff = Math.abs(totalDebit - totalCredit)
  return { valid: diff <= TOLERANCE, diff }
}

export function validerCompte(compte: string): boolean {
  return /^\d{6}$/.test(compte)
}

export async function validerExerciceOuvert(
  exerciceId: string,
  db: {
    exercice: {
      findUnique: (args: { where: { id: string } }) => Promise<{ statut: string } | null>
    }
  },
): Promise<boolean> {
  const exercice = await db.exercice.findUnique({ where: { id: exerciceId } })
  return exercice?.statut === 'OUVERT'
}
