import { describe, expect, it } from 'vitest'
import { calcAmortissement } from '../server/lib/syscohada/amortissements'

describe('calcAmortissement', () => {
  describe('linéaire', () => {
    it('calcule 5 ans linéaire', () => {
      const tableau = calcAmortissement(500000, 5, 'LINEAIRE')
      expect(tableau).toHaveLength(5)
      expect(tableau[0]!.annuite).toBe(100000)
      expect(tableau[0]!.taux).toBe(20)
      expect(tableau[4]!.vnc).toBe(0)
      expect(tableau[4]!.amortCumule).toBe(500000)
    })

    it('calcule 3 ans linéaire', () => {
      const tableau = calcAmortissement(300000, 3, 'LINEAIRE')
      expect(tableau).toHaveLength(3)
      expect(tableau[0]!.annuite).toBe(100000)
      expect(tableau[2]!.vnc).toBe(0)
    })
  })

  describe('dégressif', () => {
    it('calcule 5 ans dégressif (coeff 2.0)', () => {
      const tableau = calcAmortissement(500000, 5, 'DEGRESSIF')
      expect(tableau).toHaveLength(5)
      // Taux dégressif = 20% * 2.0 = 40%
      expect(tableau[0]!.annuite).toBe(200000)
      expect(tableau[0]!.taux).toBe(40)
      // VNC finale = 0
      expect(tableau[4]!.vnc).toBe(0)
    })

    it('calcule 3 ans dégressif (coeff 1.5)', () => {
      const tableau = calcAmortissement(300000, 3, 'DEGRESSIF')
      expect(tableau).toHaveLength(3)
      // Taux = 33.33% * 1.5 = 50%
      expect(tableau[0]!.annuite).toBe(150000)
      expect(tableau[2]!.vnc).toBe(0)
    })

    it('VNC toujours >= 0', () => {
      const tableau = calcAmortissement(1000000, 10, 'DEGRESSIF')
      for (const row of tableau) {
        expect(row.vnc).toBeGreaterThanOrEqual(0)
      }
    })
  })
})
