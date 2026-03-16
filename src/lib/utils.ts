import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatFCFA = (n: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
  }).format(n)

export function parseDateOHADA(dateStr: string): Date {
  const [day, month, year] = dateStr.split('/')
  return new Date(Number(year), Number(month) - 1, Number(day))
}

export function formatDateOHADA(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function getExerciceLabel(annee: number): string {
  return `Exercice ${annee}`
}

export function generateSlug(raisonSociale: string): string {
  return raisonSociale
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50)
}
