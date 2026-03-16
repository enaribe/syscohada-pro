import type { Plan, Role, StatutExercice, Zone } from '@/generated/prisma/enums'

export type TEntreprise = {
  id: string
  raisonSociale: string
  slug: string
  formeJuridique: string | null
  ninea: string | null
  zone: Zone
  plan: Plan
}

export type TExercice = {
  id: string
  annee: number
  statut: StatutExercice
  dateDebut: Date
  dateFin: Date
}

export type TUser = {
  id: string
  email: string
  nom: string
  prenom: string | null
  role: Role
  tenantId: string
}

export type RegisterStep1Data = {
  raisonSociale: string
  formeJuridique: string
  zone: Zone
  ninea?: string
}

export type RegisterStep2Data = {
  prenom: string
  nom: string
  email: string
  password: string
  confirmPassword: string
}
