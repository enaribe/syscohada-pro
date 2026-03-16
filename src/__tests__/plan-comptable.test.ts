import { describe, expect, it } from 'vitest'
import {
  PLAN_COMPTABLE,
  rechercheCompte,
  validerCompte,
} from '../server/lib/syscohada/plan-comptable'

describe('PLAN_COMPTABLE', () => {
  it('contient plus de 100 comptes', () => {
    expect(Object.keys(PLAN_COMPTABLE).length).toBeGreaterThan(100)
  })

  it('contient les comptes clés', () => {
    expect(PLAN_COMPTABLE['101000']).toBe('Capital social')
    expect(PLAN_COMPTABLE['411000']).toBe('Clients')
    expect(PLAN_COMPTABLE['521000']).toBe('Banques locales')
    expect(PLAN_COMPTABLE['601000']).toBe('Achats de marchandises')
    expect(PLAN_COMPTABLE['701000']).toBe('Ventes de marchandises')
  })
})

describe('rechercheCompte', () => {
  it('trouve par numéro', () => {
    const results = rechercheCompte('411')
    expect(results.some((r) => r.compte === '411000')).toBe(true)
  })

  it('trouve par intitulé', () => {
    const results = rechercheCompte('client')
    expect(results.some((r) => r.compte === '411000')).toBe(true)
  })

  it('retourne max 20 résultats', () => {
    const results = rechercheCompte('a')
    expect(results.length).toBeLessThanOrEqual(20)
  })

  it('retourne un tableau vide si aucun résultat', () => {
    const results = rechercheCompte('zzzzzzz')
    expect(results).toHaveLength(0)
  })
})

describe('validerCompte', () => {
  it('valide un compte existant', () => {
    expect(validerCompte('411000')).toBe(true)
  })

  it('valide un numéro à 6 chiffres', () => {
    expect(validerCompte('999999')).toBe(true)
  })

  it('invalide un numéro trop court', () => {
    expect(validerCompte('411')).toBe(false)
  })

  it('invalide un texte', () => {
    expect(validerCompte('abcdef')).toBe(false)
  })
})
