import { describe, expect, it } from 'vitest'
import { calcProchaineDate } from '../server/trpc/routers/recurrentes'

describe('calcProchaineDate', () => {
  const base = new Date('2026-03-15')

  it('MENSUELLE → +1 mois', () => {
    const next = calcProchaineDate(base, 'MENSUELLE')
    expect(next.getMonth()).toBe(3) // avril
    expect(next.getDate()).toBe(15)
  })

  it('BIMESTRIELLE → +2 mois', () => {
    const next = calcProchaineDate(base, 'BIMESTRIELLE')
    expect(next.getMonth()).toBe(4) // mai
  })

  it('TRIMESTRIELLE → +3 mois', () => {
    const next = calcProchaineDate(base, 'TRIMESTRIELLE')
    expect(next.getMonth()).toBe(5) // juin
  })

  it('SEMESTRIELLE → +6 mois', () => {
    const next = calcProchaineDate(base, 'SEMESTRIELLE')
    expect(next.getMonth()).toBe(8) // septembre
  })

  it('ANNUELLE → +1 an', () => {
    const next = calcProchaineDate(base, 'ANNUELLE')
    expect(next.getFullYear()).toBe(2027)
    expect(next.getMonth()).toBe(2)
  })
})
