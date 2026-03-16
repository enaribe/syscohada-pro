import { prisma } from '@/server/db/prisma'
import type { TKpis } from '@/types/syscohada'

export async function calculerKPIs(tenantId: string, exerciceId: string): Promise<TKpis> {
  const lignes = await prisma.ligneEcriture.findMany({
    where: {
      tenantId,
      ecriture: { exerciceId, deletedAt: null },
    },
    select: { compte: true, debit: true, credit: true },
  })

  let ca = 0
  let charges = 0
  let tresorerie = 0
  let creances = 0
  let dettes = 0
  let tvaCollectee = 0
  let tvaDeductible = 0

  for (const l of lignes) {
    const d = Number(l.debit)
    const c = Number(l.credit)
    const prefix = l.compte.substring(0, 2)
    const prefix3 = l.compte.substring(0, 3)

    // CA: comptes 70*
    if (prefix === '70') ca += c - d
    // Charges: comptes 60*
    if (l.compte[0] === '6') charges += d - c
    // Trésorerie: comptes 5*
    if (l.compte[0] === '5') tresorerie += d - c
    // Créances: comptes 411*
    if (prefix3 === '411') creances += d - c
    // Dettes fournisseurs: comptes 401*
    if (prefix3 === '401') dettes += c - d
    // TVA collectée: 443*
    if (prefix3 === '443') tvaCollectee += c - d
    // TVA déductible: 445*
    if (prefix3 === '445') tvaDeductible += d - c
  }

  // Nb écritures du mois courant
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const nbEcrituresMois = await prisma.ecriture.count({
    where: {
      tenantId,
      exerciceId,
      deletedAt: null,
      date: { gte: startOfMonth },
    },
  })

  return {
    chiffreAffaires: ca,
    charges,
    resultat: ca - charges,
    tresorerie,
    creances,
    dettes,
    tvaNette: tvaCollectee - tvaDeductible,
    nbEcrituresMois,
  }
}

export type ChartData = {
  caMensuel: { mois: string; montant: number }[]
  tresorerieMensuelle: { mois: string; montant: number }[]
  repartitionCharges: { label: string; montant: number }[]
  topCharges: { label: string; montant: number }[]
}

export async function calculerCharts(tenantId: string, exerciceId: string): Promise<ChartData> {
  const ecritures = await prisma.ecriture.findMany({
    where: { tenantId, exerciceId, deletedAt: null },
    include: { lignes: true },
    orderBy: { date: 'asc' },
  })

  const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
  const caMensuel = MOIS.map((mois) => ({ mois, montant: 0 }))
  const tresorerieMensuelle = MOIS.map((mois) => ({ mois, montant: 0 }))
  const chargesParCompte = new Map<string, number>()

  for (const e of ecritures) {
    const moisIdx = new Date(e.date).getMonth()
    for (const l of e.lignes) {
      const d = Number(l.debit)
      const c = Number(l.credit)
      const prefix = l.compte.substring(0, 2)

      if (prefix === '70') {
        caMensuel[moisIdx]!.montant += c - d
      }
      if (l.compte[0] === '5') {
        tresorerieMensuelle[moisIdx]!.montant += d - c
      }
      if (l.compte[0] === '6') {
        const current = chargesParCompte.get(l.compte) ?? 0
        chargesParCompte.set(l.compte, current + d - c)
      }
    }
  }

  // Cumul trésorerie
  for (let i = 1; i < 12; i++) {
    tresorerieMensuelle[i]!.montant += tresorerieMensuelle[i - 1]!.montant
  }

  const repartitionCharges = [
    { label: 'Achats', montant: 0 },
    { label: 'Services', montant: 0 },
    { label: 'Personnel', montant: 0 },
    { label: 'Impôts', montant: 0 },
    { label: 'Autres', montant: 0 },
  ]
  for (const [compte, montant] of chargesParCompte) {
    const p = compte.substring(0, 2)
    if (p === '60') repartitionCharges[0]!.montant += montant
    else if (p >= '61' && p <= '63') repartitionCharges[1]!.montant += montant
    else if (p >= '66' && p <= '66') repartitionCharges[2]!.montant += montant
    else if (p >= '64' && p <= '65') repartitionCharges[3]!.montant += montant
    else repartitionCharges[4]!.montant += montant
  }

  const topCharges = [...chargesParCompte.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, montant]) => ({ label, montant }))

  return { caMensuel, tresorerieMensuelle, repartitionCharges, topCharges }
}
