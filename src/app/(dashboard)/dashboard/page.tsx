'use client'

import {
  Calculator,
  CreditCard,
  FileText,
  Landmark,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import {
  ChartCaMensuel,
  ChartRepartition,
  ChartTopCharges,
  ChartTresorerie,
} from '@/components/charts/dashboard-charts'
import { KpiCard } from '@/components/charts/kpi-card'
import { trpc } from '@/lib/trpc-client'
import { useAppStore } from '@/store/app.store'

export default function DashboardPage() {
  const { exerciceAnnee } = useAppStore()
  const { data: kpis } = trpc.dashboard.get.useQuery()
  const { data: charts } = trpc.dashboard.getCharts.useQuery()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tableau de bord — Exercice {exerciceAnnee}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Chiffre d'affaires"
          value={kpis?.chiffreAffaires ?? 0}
          icon={TrendingUp}
          color="bg-blue-500"
        />
        <KpiCard
          label="Charges"
          value={kpis?.charges ?? 0}
          icon={TrendingDown}
          color="bg-orange-500"
        />
        <KpiCard
          label="Résultat"
          value={kpis?.resultat ?? 0}
          icon={Calculator}
          color={kpis && kpis.resultat < 0 ? 'bg-red-500' : 'bg-green-500'}
          alert={kpis ? kpis.resultat < 0 : false}
        />
        <KpiCard
          label="Trésorerie"
          value={kpis?.tresorerie ?? 0}
          icon={Wallet}
          color={kpis && kpis.tresorerie < 0 ? 'bg-red-500' : 'bg-emerald-500'}
          alert={kpis ? kpis.tresorerie < 0 : false}
        />
        <KpiCard
          label="Créances clients"
          value={kpis?.creances ?? 0}
          icon={Receipt}
          color="bg-purple-500"
        />
        <KpiCard
          label="Dettes fournisseurs"
          value={kpis?.dettes ?? 0}
          icon={CreditCard}
          color="bg-pink-500"
        />
        <KpiCard
          label="TVA nette"
          value={kpis?.tvaNette ?? 0}
          icon={Landmark}
          color="bg-indigo-500"
        />
        <KpiCard
          label="Écritures du mois"
          value={kpis?.nbEcrituresMois ?? 0}
          icon={FileText}
          color="bg-gray-500"
        />
      </div>

      {charts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCaMensuel data={charts.caMensuel} />
          <ChartTresorerie data={charts.tresorerieMensuelle} />
          <ChartRepartition data={charts.repartitionCharges} />
          <ChartTopCharges data={charts.topCharges} />
        </div>
      )}
    </div>
  )
}
