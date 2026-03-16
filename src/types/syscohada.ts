import type { Journal, Source, StatutExercice, Zone } from '@/generated/prisma/enums'

export type TEntreprise = {
  id: string
  raisonSociale: string
  slug: string
  formeJuridique: string | null
  ninea: string | null
  zone: Zone
}

export type TExercice = {
  id: string
  annee: number
  statut: StatutExercice
  dateDebut: Date
  dateFin: Date
}

export type TLigne = {
  compte: string
  intitule: string
  debit: number
  credit: number
}

export type TEcriture = {
  id: string
  date: Date
  journal: Journal
  libelle: string
  piece: string | null
  source: Source
  lignes: TLigne[]
}

export type TBalance = {
  compte: string
  intitule: string
  totalDebit: number
  totalCredit: number
  soldeDebit: number
  soldeCredit: number
}

export type TKpis = {
  chiffreAffaires: number
  charges: number
  resultat: number
  tresorerie: number
  creances: number
  dettes: number
  tvaNette: number
  nbEcrituresMois: number
}

export type TImmobilisation = {
  id: string
  designation: string
  compteImmo: string
  compteAmort: string
  dateAcquisition: Date
  valeurOrigine: number
  dureeVie: number
  methode: 'LINEAIRE' | 'DEGRESSIF'
}

export type TTableauAmort = {
  annee: number
  baseAmort: number
  taux: number
  annuite: number
  amortCumule: number
  vnc: number
}

export type TLigneLiasse = {
  reference: string
  libelle: string
  montantN: number
  montantN1: number
}
