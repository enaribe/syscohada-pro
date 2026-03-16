import type { TBalance } from '@/types/syscohada'

type PosteBilan = { reference: string; libelle: string; montant: number }
type PosteCR = { reference: string; libelle: string; montant: number }

function sumComptes(balance: TBalance[], prefixes: string[], side: 'debit' | 'credit'): number {
  return balance
    .filter((b) => prefixes.some((p) => b.compte.startsWith(p)))
    .reduce((sum, b) => sum + (side === 'debit' ? b.soldeDebit : b.soldeCredit), 0)
}

function soldeComptes(balance: TBalance[], prefixes: string[]): number {
  return balance
    .filter((b) => prefixes.some((p) => b.compte.startsWith(p)))
    .reduce((sum, b) => sum + b.soldeDebit - b.soldeCredit, 0)
}

export function calculerBilan(balance: TBalance[]): { actif: PosteBilan[]; passif: PosteBilan[] } {
  const actif: PosteBilan[] = [
    {
      reference: 'AA',
      libelle: "Frais d'établissement",
      montant: sumComptes(balance, ['201'], 'debit'),
    },
    {
      reference: 'AB',
      libelle: 'Brevets, licences, logiciels',
      montant: sumComptes(balance, ['205', '206'], 'debit'),
    },
    {
      reference: 'AC',
      libelle: 'Fonds commercial',
      montant: sumComptes(balance, ['207'], 'debit'),
    },
    { reference: 'AD', libelle: 'Terrains', montant: sumComptes(balance, ['211', '212'], 'debit') },
    {
      reference: 'AE',
      libelle: 'Bâtiments',
      montant: sumComptes(balance, ['213', '221', '222', '223', '231'], 'debit'),
    },
    {
      reference: 'AF',
      libelle: 'Installations et agencements',
      montant: sumComptes(balance, ['214', '215'], 'debit'),
    },
    {
      reference: 'AG',
      libelle: 'Matériel et outillage',
      montant: sumComptes(balance, ['241', '242', '243'], 'debit'),
    },
    {
      reference: 'AH',
      libelle: 'Matériel de transport',
      montant: sumComptes(balance, ['245'], 'debit'),
    },
    {
      reference: 'AI',
      libelle: 'Amortissements (déduction)',
      montant: -sumComptes(balance, ['28'], 'credit'),
    },
    {
      reference: 'AJ',
      libelle: 'Titres de participation',
      montant: sumComptes(balance, ['26'], 'debit'),
    },
    {
      reference: 'AK',
      libelle: 'Autres immobilisations financières',
      montant: sumComptes(balance, ['27'], 'debit'),
    },
    {
      reference: 'AL',
      libelle: 'Stocks et en-cours',
      montant: soldeComptes(balance, ['31', '32', '33', '34', '35', '36', '37']),
    },
    {
      reference: 'AM',
      libelle: 'Fournisseurs, avances versées',
      montant: sumComptes(balance, ['409'], 'debit'),
    },
    {
      reference: 'AN',
      libelle: 'Clients',
      montant: sumComptes(balance, ['411', '412', '414', '418'], 'debit'),
    },
    {
      reference: 'AO',
      libelle: 'Autres créances',
      montant: sumComptes(balance, ['416', '42', '44', '45', '46', '47'], 'debit'),
    },
    {
      reference: 'AP',
      libelle: 'Trésorerie Actif',
      montant: sumComptes(balance, ['50', '51', '52', '53', '54', '57'], 'debit'),
    },
  ]

  const passif: PosteBilan[] = [
    { reference: 'BA', libelle: 'Capital social', montant: sumComptes(balance, ['101'], 'credit') },
    {
      reference: 'BB',
      libelle: 'Primes et réserves',
      montant: sumComptes(balance, ['104', '106', '111', '112', '118'], 'credit'),
    },
    {
      reference: 'BC',
      libelle: 'Report à nouveau',
      montant:
        soldeComptes(balance, ['12']) < 0
          ? Math.abs(soldeComptes(balance, ['12']))
          : soldeComptes(balance, ['12']),
    },
    {
      reference: 'BD',
      libelle: 'Résultat net',
      montant: sumComptes(balance, ['13'], 'credit') - sumComptes(balance, ['13'], 'debit'),
    },
    {
      reference: 'BE',
      libelle: "Subventions d'investissement",
      montant: sumComptes(balance, ['14'], 'credit'),
    },
    {
      reference: 'BF',
      libelle: 'Provisions réglementées',
      montant: sumComptes(balance, ['15'], 'credit'),
    },
    {
      reference: 'BG',
      libelle: 'Emprunts et dettes financières',
      montant: sumComptes(balance, ['16', '17'], 'credit'),
    },
    {
      reference: 'BH',
      libelle: 'Provisions pour risques',
      montant: sumComptes(balance, ['19'], 'credit'),
    },
    {
      reference: 'BI',
      libelle: 'Fournisseurs',
      montant: sumComptes(balance, ['401', '402', '408'], 'credit'),
    },
    {
      reference: 'BJ',
      libelle: 'Clients, avances reçues',
      montant: sumComptes(balance, ['419'], 'credit'),
    },
    {
      reference: 'BK',
      libelle: 'Dettes fiscales et sociales',
      montant: sumComptes(balance, ['42', '43', '44'], 'credit'),
    },
    {
      reference: 'BL',
      libelle: 'Autres dettes',
      montant: sumComptes(balance, ['45', '46', '47'], 'credit'),
    },
    {
      reference: 'BM',
      libelle: 'Trésorerie Passif',
      montant: sumComptes(balance, ['56'], 'credit'),
    },
  ]

  return { actif, passif }
}

export function calculerCR(balance: TBalance[]): {
  exploitation: PosteCR[]
  financier: PosteCR[]
  hao: PosteCR[]
  resultatNet: number
} {
  const exploitation: PosteCR[] = [
    {
      reference: 'TA',
      libelle: 'Ventes de marchandises',
      montant: sumComptes(balance, ['701'], 'credit'),
    },
    {
      reference: 'TB',
      libelle: 'Ventes de produits fabriqués',
      montant: sumComptes(balance, ['702', '703', '704'], 'credit'),
    },
    {
      reference: 'TC',
      libelle: 'Travaux, services vendus',
      montant: sumComptes(balance, ['705', '706'], 'credit'),
    },
    {
      reference: 'TD',
      libelle: 'Production stockée',
      montant: soldeComptes(balance, ['713', '714']),
    },
    {
      reference: 'TE',
      libelle: 'Production immobilisée',
      montant: sumComptes(balance, ['72'], 'credit'),
    },
    {
      reference: 'TF',
      libelle: "Subventions d'exploitation",
      montant: sumComptes(balance, ['711', '741', '754'], 'credit'),
    },
    {
      reference: 'TG',
      libelle: 'Autres produits',
      montant: sumComptes(balance, ['707', '718', '75'], 'credit'),
    },
    {
      reference: 'TH',
      libelle: 'Achats de marchandises',
      montant: sumComptes(balance, ['601'], 'debit'),
    },
    {
      reference: 'TI',
      libelle: 'Achats de matières premières',
      montant: sumComptes(balance, ['602', '604', '605', '608'], 'debit'),
    },
    { reference: 'TJ', libelle: 'Variation de stocks', montant: soldeComptes(balance, ['603']) },
    { reference: 'TK', libelle: 'Transports', montant: sumComptes(balance, ['61'], 'debit') },
    {
      reference: 'TL',
      libelle: 'Services extérieurs',
      montant: sumComptes(balance, ['62', '63'], 'debit'),
    },
    { reference: 'TM', libelle: 'Impôts et taxes', montant: sumComptes(balance, ['64'], 'debit') },
    { reference: 'TN', libelle: 'Autres charges', montant: sumComptes(balance, ['65'], 'debit') },
    {
      reference: 'TO',
      libelle: 'Charges de personnel',
      montant: sumComptes(balance, ['66'], 'debit'),
    },
    {
      reference: 'TP',
      libelle: 'Dotations amortissements',
      montant: sumComptes(balance, ['681', '691'], 'debit'),
    },
  ]

  const produitsExpl = exploitation.filter((_, i) => i <= 6).reduce((s, p) => s + p.montant, 0)
  const chargesExpl = exploitation.filter((_, i) => i > 6).reduce((s, p) => s + p.montant, 0)
  const resultatExpl = produitsExpl - chargesExpl

  const financier: PosteCR[] = [
    {
      reference: 'UA',
      libelle: 'Revenus financiers',
      montant: sumComptes(balance, ['77'], 'credit'),
    },
    {
      reference: 'UB',
      libelle: 'Reprises provisions financières',
      montant: sumComptes(balance, ['79'], 'credit'),
    },
    {
      reference: 'UC',
      libelle: 'Charges financières',
      montant: sumComptes(balance, ['67'], 'debit'),
    },
    {
      reference: 'UD',
      libelle: 'Dotations provisions financières',
      montant: sumComptes(balance, ['697'], 'debit'),
    },
  ]

  const resultatFin =
    financier[0]!.montant + financier[1]!.montant - (financier[2]!.montant + financier[3]!.montant)

  const hao: PosteCR[] = [
    {
      reference: 'UH',
      libelle: 'Produits HAO',
      montant: sumComptes(balance, ['82', '84', '86'], 'credit'),
    },
    {
      reference: 'UI',
      libelle: 'Charges HAO',
      montant: sumComptes(balance, ['81', '83', '85'], 'debit'),
    },
  ]

  const resultatHAO = hao[0]!.montant - hao[1]!.montant
  const impots = sumComptes(balance, ['87', '88', '89'], 'debit')
  const resultatNet = resultatExpl + resultatFin + resultatHAO - impots

  return { exploitation, financier, hao, resultatNet }
}

export function calculerTAFIRE(balance: TBalance[]): {
  exploitation: { libelle: string; montant: number }[]
  investissement: { libelle: string; montant: number }[]
  financement: { libelle: string; montant: number }[]
  variationTresorerie: number
} {
  const cr = calculerCR(balance)

  const dap = sumComptes(balance, ['681', '691', '697'], 'debit')
  const reprises = sumComptes(balance, ['781', '791'], 'credit')

  const exploitation = [
    { libelle: 'Résultat net', montant: cr.resultatNet },
    { libelle: 'Dotations aux amortissements', montant: dap },
    { libelle: 'Reprises de provisions', montant: -reprises },
    { libelle: "Capacité d'autofinancement", montant: cr.resultatNet + dap - reprises },
  ]

  const investissement = [
    {
      libelle: "Acquisitions d'immobilisations",
      montant: -sumComptes(balance, ['21', '22', '23', '24', '25'], 'debit'),
    },
    { libelle: "Cessions d'immobilisations", montant: sumComptes(balance, ['82'], 'credit') },
  ]

  const financement = [
    { libelle: 'Emprunts nouveaux', montant: sumComptes(balance, ['16'], 'credit') },
    { libelle: "Remboursements d'emprunts", montant: -sumComptes(balance, ['16'], 'debit') },
    { libelle: 'Augmentation de capital', montant: sumComptes(balance, ['101', '104'], 'credit') },
  ]

  const fluxExpl = exploitation.reduce((s, e) => s + e.montant, 0)
  const fluxInvest = investissement.reduce((s, e) => s + e.montant, 0)
  const fluxFin = financement.reduce((s, e) => s + e.montant, 0)

  return {
    exploitation,
    investissement,
    financement,
    variationTresorerie: fluxExpl + fluxInvest + fluxFin,
  }
}

export function calculerRatios(
  bilan: ReturnType<typeof calculerBilan>,
  cr: ReturnType<typeof calculerCR>,
): { nom: string; valeur: number; unite: string }[] {
  const totalActif = bilan.actif.reduce((s, p) => s + p.montant, 0)
  const totalPassif = bilan.passif.reduce((s, p) => s + p.montant, 0)
  const capitauxPropres =
    (bilan.passif.find((p) => p.reference === 'BA')?.montant ?? 0) +
    (bilan.passif.find((p) => p.reference === 'BB')?.montant ?? 0) +
    (bilan.passif.find((p) => p.reference === 'BC')?.montant ?? 0) +
    (bilan.passif.find((p) => p.reference === 'BD')?.montant ?? 0)
  const ca = cr.exploitation.filter((_, i) => i <= 2).reduce((s, p) => s + p.montant, 0)
  const dettes = totalPassif - capitauxPropres
  const tresoActif = bilan.actif.find((p) => p.reference === 'AP')?.montant ?? 0
  const tresoPassif = bilan.passif.find((p) => p.reference === 'BM')?.montant ?? 0

  return [
    {
      nom: 'Ratio de liquidité générale',
      valeur: totalActif > 0 && dettes > 0 ? totalActif / dettes : 0,
      unite: 'x',
    },
    {
      nom: "Ratio d'endettement",
      valeur: capitauxPropres > 0 ? dettes / capitauxPropres : 0,
      unite: 'x',
    },
    {
      nom: 'Rentabilité des capitaux propres',
      valeur: capitauxPropres > 0 ? (cr.resultatNet / capitauxPropres) * 100 : 0,
      unite: '%',
    },
    { nom: 'Marge nette', valeur: ca > 0 ? (cr.resultatNet / ca) * 100 : 0, unite: '%' },
    {
      nom: 'Autonomie financière',
      valeur: totalPassif > 0 ? (capitauxPropres / totalPassif) * 100 : 0,
      unite: '%',
    },
    { nom: 'Trésorerie nette', valeur: tresoActif - tresoPassif, unite: 'FCFA' },
    { nom: 'Fonds de roulement', valeur: capitauxPropres + dettes - totalActif, unite: 'FCFA' },
    {
      nom: 'Rotation des stocks',
      valeur:
        ca > 0 ? ca / Math.max(1, bilan.actif.find((p) => p.reference === 'AL')?.montant ?? 1) : 0,
      unite: 'x',
    },
    {
      nom: 'Délai moyen clients (jours)',
      valeur:
        ca > 0 ? ((bilan.actif.find((p) => p.reference === 'AN')?.montant ?? 0) / ca) * 360 : 0,
      unite: 'j',
    },
  ]
}
