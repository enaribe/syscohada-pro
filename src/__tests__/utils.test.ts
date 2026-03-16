import { describe, expect, it } from 'vitest'
import {
  formatDateOHADA,
  formatFCFA,
  generateSlug,
  getExerciceLabel,
  parseDateOHADA,
} from '../lib/utils'

describe('formatFCFA', () => {
  it('formate un montant en FCFA', () => {
    const result = formatFCFA(1500000)
    expect(result).toContain('1')
    expect(result).toContain('500')
    expect(result).toContain('000')
  })

  it('formate zéro', () => {
    const result = formatFCFA(0)
    expect(result).toContain('0')
  })

  it('formate un montant négatif', () => {
    const result = formatFCFA(-250000)
    expect(result).toContain('250')
  })
})

describe('parseDateOHADA', () => {
  it('parse une date au format JJ/MM/AAAA', () => {
    const date = parseDateOHADA('15/03/2026')
    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(2) // mars = 2
    expect(date.getDate()).toBe(15)
  })
})

describe('formatDateOHADA', () => {
  it('formate une date au format JJ/MM/AAAA', () => {
    const date = new Date(2026, 2, 15)
    const result = formatDateOHADA(date)
    expect(result).toBe('15/03/2026')
  })
})

describe('getExerciceLabel', () => {
  it('retourne le label', () => {
    expect(getExerciceLabel(2026)).toBe('Exercice 2026')
  })
})

describe('generateSlug', () => {
  it('convertit en slug', () => {
    expect(generateSlug('SARL Koffi & Frères')).toBe('sarl-koffi-freres')
  })

  it('gère les accents', () => {
    expect(generateSlug('Société Générale')).toBe('societe-generale')
  })

  it('limite à 50 caractères', () => {
    const longName = 'A'.repeat(100)
    expect(generateSlug(longName).length).toBeLessThanOrEqual(50)
  })

  it('supprime les tirets en début et fin', () => {
    expect(generateSlug('---test---')).toBe('test')
  })
})
