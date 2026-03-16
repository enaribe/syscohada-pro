'use client'

import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatFCFA } from '@/lib/utils'

export function KpiCard({
  label,
  value,
  icon: Icon,
  color,
  alert,
}: {
  label: string
  value: number
  icon: LucideIcon
  color: string
  alert?: boolean
}) {
  return (
    <Card className={alert ? 'border-red-300 bg-red-50' : ''}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className={`text-xl font-bold mt-1 ${value < 0 ? 'text-red-600' : ''}`}>
              {formatFCFA(value)}
            </p>
          </div>
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
