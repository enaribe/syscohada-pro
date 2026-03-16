import type { TTableauAmort } from '@/types/syscohada'

function getCoeffDegressif(duree: number): number {
  if (duree <= 3) return 1.5
  if (duree <= 5) return 2.0
  return 2.5
}

export function calcAmortissement(
  valeur: number,
  duree: number,
  methode: 'LINEAIRE' | 'DEGRESSIF',
): TTableauAmort[] {
  const tableau: TTableauAmort[] = []

  if (methode === 'LINEAIRE') {
    const annuite = valeur / duree
    const taux = 100 / duree
    let cumul = 0
    for (let i = 1; i <= duree; i++) {
      cumul += annuite
      tableau.push({
        annee: i,
        baseAmort: valeur,
        taux,
        annuite,
        amortCumule: Math.round(cumul * 100) / 100,
        vnc: Math.round((valeur - cumul) * 100) / 100,
      })
    }
  } else {
    const coeff = getCoeffDegressif(duree)
    const tauxDegressif = (100 / duree) * coeff
    let vnc = valeur
    let cumul = 0

    for (let i = 1; i <= duree; i++) {
      const dureeRestante = duree - i + 1
      const tauxLin = 100 / dureeRestante
      const useLin = tauxLin >= tauxDegressif

      const taux = useLin ? tauxLin : tauxDegressif
      const base = useLin ? vnc : vnc
      const annuite = i === duree ? vnc : Math.round(((base * taux) / 100) * 100) / 100

      cumul += annuite
      vnc = Math.round((vnc - annuite) * 100) / 100

      tableau.push({
        annee: i,
        baseAmort: base,
        taux: Math.round(taux * 100) / 100,
        annuite,
        amortCumule: Math.round(cumul * 100) / 100,
        vnc: Math.max(0, vnc),
      })
    }
  }

  return tableau
}
