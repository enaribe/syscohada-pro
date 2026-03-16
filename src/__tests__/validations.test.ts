import { describe, expect, it } from 'vitest'
import { validerEquilibre } from '../server/lib/syscohada/validations'

describe('validerEquilibre', () => {
  it('valide une écriture équilibrée', () => {
    const result = validerEquilibre([
      { compte: '411000', intitule: 'Clients', debit: 118000, credit: 0 },
      { compte: '701000', intitule: 'Ventes', debit: 0, credit: 100000 },
      { compte: '443000', intitule: 'TVA', debit: 0, credit: 18000 },
    ])
    expect(result.valid).toBe(true)
    expect(result.diff).toBe(0)
  })

  it('rejette une écriture déséquilibrée', () => {
    const result = validerEquilibre([
      { compte: '411000', intitule: 'Clients', debit: 100000, credit: 0 },
      { compte: '701000', intitule: 'Ventes', debit: 0, credit: 90000 },
    ])
    expect(result.valid).toBe(false)
    expect(result.diff).toBe(10000)
  })

  it('tolère une différence de 0.01', () => {
    const result = validerEquilibre([
      { compte: '411000', intitule: 'Clients', debit: 100000.005, credit: 0 },
      { compte: '701000', intitule: 'Ventes', debit: 0, credit: 100000 },
    ])
    expect(result.valid).toBe(true)
  })

  it('rejette une différence de 0.02', () => {
    const result = validerEquilibre([
      { compte: '411000', intitule: 'Clients', debit: 100000.02, credit: 0 },
      { compte: '701000', intitule: 'Ventes', debit: 0, credit: 100000 },
    ])
    expect(result.valid).toBe(false)
  })

  it('valide une écriture avec une seule ligne D=C', () => {
    const result = validerEquilibre([
      { compte: '521000', intitule: 'Banque', debit: 50000, credit: 50000 },
    ])
    expect(result.valid).toBe(true)
  })
})
