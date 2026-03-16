import { validerEquilibre } from '@/server/lib/syscohada/validations'

type LigneIA = {
  compte: string
  intitule: string
  debit: number
  credit: number
}

type EcritureIA = {
  lignes: LigneIA[]
  explication: string
}

type OcrResult = {
  fournisseur: string
  date: string
  numero: string
  montantHT: number
  tva: number
  totalTTC: number
  ecritureProposee: { lignes: LigneIA[] }
}

export function parseEcritureIA(text: string): EcritureIA | null {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0]) as EcritureIA
    if (!parsed.lignes || !Array.isArray(parsed.lignes)) return null

    const { valid } = validerEquilibre(parsed.lignes)
    if (!valid) {
      console.warn('IA: écriture déséquilibrée, rejetée')
      return null
    }

    return parsed
  } catch {
    console.warn('IA: JSON malformé')
    return null
  }
}

export function parseOcrResult(text: string): OcrResult | null {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0]) as OcrResult
    if (!parsed.montantHT || !parsed.ecritureProposee) return null

    return parsed
  } catch {
    console.warn('IA OCR: JSON malformé')
    return null
  }
}
