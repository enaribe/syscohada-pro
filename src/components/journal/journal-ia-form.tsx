'use client'

import { Bot, Loader2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { trpc } from '@/lib/trpc-client'

type LigneIA = {
  compte: string
  intitule: string
  debit: number
  credit: number
}

export function JournalIAForm({
  exerciceId,
  onResult,
}: {
  exerciceId: string
  onResult: (lignes: LigneIA[], explication: string) => void
}) {
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const genererMutation = trpc.ia.genererEcriture.useMutation({
    onSuccess: (data) => {
      if (data.fallback) {
        toast.warning(data.explication)
        return
      }
      onResult(data.lignes, data.explication)
      toast.success("Écriture générée par l'IA")
    },
    onError: (err) => toast.error(err.message),
    onSettled: () => setLoading(false),
  })

  const ocrMutation = trpc.ia.ocrFacture.useMutation({
    onSuccess: (data) => {
      if ('fallback' in data) {
        toast.warning(data.message)
        return
      }
      onResult(
        data.ecritureProposee.lignes,
        `Facture ${data.fournisseur} - ${data.totalTTC} FCFA TTC`,
      )
      toast.success(`Facture ${data.fournisseur} analysée`)
    },
    onError: (err) => toast.error(err.message),
    onSettled: () => setLoading(false),
  })

  function handleGenerate() {
    if (!description.trim()) return
    setLoading(true)
    genererMutation.mutate({ description, exerciceId })
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Fichier trop volumineux (max 10 Mo)')
      return
    }

    setLoading(true)
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1]
      if (base64) {
        ocrMutation.mutate({
          fileBase64: base64,
          mimeType: file.type,
          exerciceId,
        })
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center gap-2 text-blue-700 font-medium">
        <Bot className="h-4 w-4" />
        Mode IA
      </div>

      <div>
        <Label>Décrivez l'opération</Label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex: Vente de marchandises 500 000 FCFA TVA 18%, payée par virement bancaire"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm min-h-[80px] mt-1"
          disabled={loading}
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={handleGenerate} disabled={loading || !description.trim()}>
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Bot className="h-4 w-4 mr-2" />
          )}
          Générer l'écriture
        </Button>

        <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={loading}>
          <Upload className="h-4 w-4 mr-2" />
          Scanner une facture
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </div>
  )
}
