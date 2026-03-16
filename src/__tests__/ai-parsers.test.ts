import { describe, expect, it } from 'vitest'
import { parseEcritureIA, parseOcrResult } from '../server/lib/ai/parsers'

describe('parseEcritureIA', () => {
  it('parse un JSON valide équilibré', () => {
    const json = JSON.stringify({
      lignes: [
        { compte: '411000', intitule: 'Clients', debit: 118000, credit: 0 },
        { compte: '701000', intitule: 'Ventes', debit: 0, credit: 100000 },
        { compte: '443000', intitule: 'TVA', debit: 0, credit: 18000 },
      ],
      explication: 'Vente de marchandises',
    })
    const result = parseEcritureIA(json)
    expect(result).not.toBeNull()
    expect(result?.lignes).toHaveLength(3)
    expect(result?.explication).toBe('Vente de marchandises')
  })

  it('rejette un JSON avec D≠C', () => {
    const json = JSON.stringify({
      lignes: [
        { compte: '411000', intitule: 'Clients', debit: 100000, credit: 0 },
        { compte: '701000', intitule: 'Ventes', debit: 0, credit: 50000 },
      ],
      explication: 'Déséquilibré',
    })
    const result = parseEcritureIA(json)
    expect(result).toBeNull()
  })

  it('retourne null pour un JSON malformé', () => {
    const result = parseEcritureIA('not json at all')
    expect(result).toBeNull()
  })

  it('extrait le JSON même avec du texte autour', () => {
    const text =
      'Voici l\'écriture: {"lignes":[{"compte":"521000","intitule":"Banque","debit":50000,"credit":0},{"compte":"411000","intitule":"Clients","debit":0,"credit":50000}],"explication":"Encaissement"} voilà.'
    const result = parseEcritureIA(text)
    expect(result).not.toBeNull()
    expect(result?.lignes).toHaveLength(2)
  })

  it('retourne null si pas de lignes', () => {
    const json = JSON.stringify({ explication: 'test' })
    const result = parseEcritureIA(json)
    expect(result).toBeNull()
  })
})

describe('parseOcrResult', () => {
  it('parse un résultat OCR valide', () => {
    const json = JSON.stringify({
      fournisseur: 'SARL Fournisseur',
      date: '2026-03-15',
      numero: 'FA-001',
      montantHT: 100000,
      tva: 18000,
      totalTTC: 118000,
      ecritureProposee: {
        lignes: [
          { compte: '601000', intitule: 'Achats', debit: 100000, credit: 0 },
          { compte: '445000', intitule: 'TVA', debit: 18000, credit: 0 },
          { compte: '401000', intitule: 'Fournisseur', debit: 0, credit: 118000 },
        ],
      },
    })
    const result = parseOcrResult(json)
    expect(result).not.toBeNull()
    expect(result?.fournisseur).toBe('SARL Fournisseur')
    expect(result?.totalTTC).toBe(118000)
  })

  it('retourne null pour un JSON malformé', () => {
    const result = parseOcrResult('garbage')
    expect(result).toBeNull()
  })
})
