'use client'

import { Chart, registerables } from 'chart.js'
import { useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

Chart.register(...registerables)

export function ChartCaMensuel({ data }: { data: { mois: string; montant: number }[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    chartRef.current?.destroy()
    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels: data.map((d) => d.mois),
        datasets: [
          {
            label: 'CA Mensuel (FCFA)',
            data: data.map((d) => d.montant),
            backgroundColor: 'rgba(59, 130, 246, 0.7)',
            borderRadius: 4,
          },
        ],
      },
      options: { responsive: true, plugins: { legend: { display: false } } },
    })
    return () => {
      chartRef.current?.destroy()
    }
  }, [data])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">CA Mensuel</CardTitle>
      </CardHeader>
      <CardContent>
        <canvas ref={canvasRef} />
      </CardContent>
    </Card>
  )
}

export function ChartTresorerie({ data }: { data: { mois: string; montant: number }[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    chartRef.current?.destroy()
    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels: data.map((d) => d.mois),
        datasets: [
          {
            label: 'Trésorerie (FCFA)',
            data: data.map((d) => d.montant),
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            fill: true,
            tension: 0.3,
          },
        ],
      },
      options: { responsive: true, plugins: { legend: { display: false } } },
    })
    return () => {
      chartRef.current?.destroy()
    }
  }, [data])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Trésorerie</CardTitle>
      </CardHeader>
      <CardContent>
        <canvas ref={canvasRef} />
      </CardContent>
    </Card>
  )
}

export function ChartRepartition({ data }: { data: { label: string; montant: number }[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    chartRef.current?.destroy()
    chartRef.current = new Chart(canvasRef.current, {
      type: 'doughnut',
      data: {
        labels: data.map((d) => d.label),
        datasets: [
          {
            data: data.map((d) => d.montant),
            backgroundColor: ['#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'],
          },
        ],
      },
      options: { responsive: true },
    })
    return () => {
      chartRef.current?.destroy()
    }
  }, [data])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Répartition Charges</CardTitle>
      </CardHeader>
      <CardContent>
        <canvas ref={canvasRef} />
      </CardContent>
    </Card>
  )
}

export function ChartTopCharges({ data }: { data: { label: string; montant: number }[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    chartRef.current?.destroy()
    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels: data.map((d) => d.label),
        datasets: [
          {
            label: 'Top Charges',
            data: data.map((d) => d.montant),
            backgroundColor: 'rgba(239, 68, 68, 0.7)',
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        indexAxis: 'y',
        plugins: { legend: { display: false } },
      },
    })
    return () => {
      chartRef.current?.destroy()
    }
  }, [data])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Top 5 Charges</CardTitle>
      </CardHeader>
      <CardContent>
        <canvas ref={canvasRef} />
      </CardContent>
    </Card>
  )
}
