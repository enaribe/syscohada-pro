'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { trpc } from '@/lib/trpc-client'
import { formatFCFA } from '@/lib/utils'
import { useAppStore } from '@/store/app.store'

export default function LiasseFiscalePage() {
  const { exerciceAnnee } = useAppStore()
  const { data } = trpc.liasse.get.useQuery()

  if (!data) return <div>Chargement...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        Liasse fiscale — {data.identification.raisonSociale} — Exercice {exerciceAnnee}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Identification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Raison sociale :</span>{' '}
              {data.identification.raisonSociale}
            </div>
            <div>
              <span className="text-gray-500">Forme juridique :</span>{' '}
              {data.identification.formeJuridique ?? '-'}
            </div>
            <div>
              <span className="text-gray-500">NINEA :</span> {data.identification.ninea ?? '-'}
            </div>
            <div>
              <span className="text-gray-500">RCCM :</span> {data.identification.rccm ?? '-'}
            </div>
            <div>
              <span className="text-gray-500">Adresse :</span> {data.identification.adresse ?? '-'}
            </div>
            <div>
              <span className="text-gray-500">Ville :</span> {data.identification.ville ?? '-'},{' '}
              {data.identification.pays}
            </div>
            <div>
              <span className="text-gray-500">Zone :</span> {data.identification.zone}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Bilan Actif</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Réf</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.bilanActif.map((p) => (
                  <TableRow key={p.reference}>
                    <TableCell>{p.reference}</TableCell>
                    <TableCell>{p.libelle}</TableCell>
                    <TableCell className="text-right font-mono">{formatFCFA(p.montant)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Bilan Passif</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Réf</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.bilanPassif.map((p) => (
                  <TableRow key={p.reference}>
                    <TableCell>{p.reference}</TableCell>
                    <TableCell>{p.libelle}</TableCell>
                    <TableCell className="text-right font-mono">{formatFCFA(p.montant)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Compte de Résultat</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Réf</TableHead>
                <TableHead>Libellé</TableHead>
                <TableHead className="text-right">Montant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.cr.map((p) => (
                <TableRow key={p.reference}>
                  <TableCell>{p.reference}</TableCell>
                  <TableCell>{p.libelle}</TableCell>
                  <TableCell className="text-right font-mono">{formatFCFA(p.montant)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div
            className={`mt-4 p-3 rounded font-bold ${data.resultatNet >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
          >
            Résultat Net : {formatFCFA(data.resultatNet)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">État IE — TVA</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Libellé</TableHead>
                <TableHead className="text-right">Montant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.etatIE.map((e) => (
                <TableRow key={e.libelle}>
                  <TableCell>{e.libelle}</TableCell>
                  <TableCell className="text-right font-mono">
                    {e.montant > 0 ? formatFCFA(e.montant) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
