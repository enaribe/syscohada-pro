'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { trpc } from '@/lib/trpc-client'
import { formatFCFA } from '@/lib/utils'
import { useAppStore } from '@/store/app.store'

export default function EtatsFinanciersPage() {
  const { exerciceAnnee } = useAppStore()
  const { data } = trpc.etats.get.useQuery()

  const totalActif = data?.bilan.actif.reduce((s, p) => s + p.montant, 0) ?? 0
  const totalPassif = data?.bilan.passif.reduce((s, p) => s + p.montant, 0) ?? 0

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">États financiers — Exercice {exerciceAnnee}</h1>

      <Tabs defaultValue="bilan">
        <TabsList>
          <TabsTrigger value="bilan">Bilan</TabsTrigger>
          <TabsTrigger value="cr">Compte de Résultat</TabsTrigger>
          <TabsTrigger value="tafire">TAFIRE</TabsTrigger>
          <TabsTrigger value="ratios">Ratios</TabsTrigger>
        </TabsList>

        <TabsContent value="bilan">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Actif</CardTitle>
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
                    {data?.bilan.actif.map((p) => (
                      <TableRow key={p.reference}>
                        <TableCell>{p.reference}</TableCell>
                        <TableCell>{p.libelle}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatFCFA(p.montant)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold bg-gray-50">
                      <TableCell colSpan={2}>TOTAL ACTIF</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatFCFA(totalActif)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Passif</CardTitle>
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
                    {data?.bilan.passif.map((p) => (
                      <TableRow key={p.reference}>
                        <TableCell>{p.reference}</TableCell>
                        <TableCell>{p.libelle}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatFCFA(p.montant)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold bg-gray-50">
                      <TableCell colSpan={2}>TOTAL PASSIF</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatFCFA(totalPassif)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
          <Badge
            variant={Math.abs(totalActif - totalPassif) <= 0.01 ? 'default' : 'destructive'}
            className="mt-2"
          >
            {Math.abs(totalActif - totalPassif) <= 0.01
              ? 'Actif = Passif'
              : `Ecart: ${formatFCFA(Math.abs(totalActif - totalPassif))}`}
          </Badge>
        </TabsContent>

        <TabsContent value="cr">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Exploitation</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Réf</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.cr.exploitation.map((p) => (
                    <TableRow key={p.reference}>
                      <TableCell>{p.reference}</TableCell>
                      <TableCell>{p.libelle}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatFCFA(p.montant)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <h3 className="font-semibold mt-4 mb-2">Financier</h3>
              <Table>
                <TableBody>
                  {data?.cr.financier.map((p) => (
                    <TableRow key={p.reference}>
                      <TableCell>{p.reference}</TableCell>
                      <TableCell>{p.libelle}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatFCFA(p.montant)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <h3 className="font-semibold mt-4 mb-2">HAO</h3>
              <Table>
                <TableBody>
                  {data?.cr.hao.map((p) => (
                    <TableRow key={p.reference}>
                      <TableCell>{p.reference}</TableCell>
                      <TableCell>{p.libelle}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatFCFA(p.montant)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div
                className={`mt-4 p-3 rounded font-bold text-lg ${(data?.cr.resultatNet ?? 0) >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
              >
                Résultat Net : {formatFCFA(data?.cr.resultatNet ?? 0)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tafire">
          <Card>
            <CardContent className="p-4 space-y-4">
              {(['exploitation', 'investissement', 'financement'] as const).map((section) => (
                <div key={section}>
                  <h3 className="font-semibold capitalize mb-2">Flux de {section}</h3>
                  <Table>
                    <TableBody>
                      {data?.tafire[section].map((f, i) => (
                        <TableRow key={i}>
                          <TableCell>{f.libelle}</TableCell>
                          <TableCell className="text-right font-mono">
                            {formatFCFA(f.montant)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
              <div className="p-3 bg-blue-50 rounded font-bold">
                Variation de trésorerie : {formatFCFA(data?.tafire.variationTresorerie ?? 0)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ratios">
          <Card>
            <CardContent className="p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ratio</TableHead>
                    <TableHead className="text-right">Valeur</TableHead>
                    <TableHead>Unité</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.ratios.map((r) => (
                    <TableRow key={r.nom}>
                      <TableCell>{r.nom}</TableCell>
                      <TableCell className="text-right font-mono">
                        {r.unite === 'FCFA' ? formatFCFA(r.valeur) : r.valeur.toFixed(2)}
                      </TableCell>
                      <TableCell>{r.unite}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
