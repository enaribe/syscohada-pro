'use client'

import { Bot, Loader2, Send, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useChat } from '@/hooks/use-ia'
import { useAppStore } from '@/store/app.store'

const SUGGESTIONS = [
  'Analyse ma trésorerie',
  'Quel est mon résultat net ?',
  'Quels sont mes principaux postes de charges ?',
  'Ai-je des créances douteuses ?',
  'Comment améliorer ma rentabilité ?',
  'Explique-moi le TAFIRE',
  'Quelles écritures de clôture dois-je passer ?',
  'Calcule ma TVA nette',
]

export default function ExpertIaPage() {
  const { exerciceAnnee } = useAppStore()
  const { messages, sendMessage, clearHistory, isStreaming } = useChat()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSend(text?: string) {
    const msg = text ?? input
    if (!msg.trim() || isStreaming) return
    sendMessage(msg)
    setInput('')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Expert IA — Exercice {exerciceAnnee}</h1>
        <Button variant="outline" size="sm" onClick={clearHistory} disabled={messages.length === 0}>
          <Trash2 className="h-4 w-4 mr-2" /> Effacer
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto bg-white rounded-lg border p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <Bot className="h-12 w-12 mx-auto text-blue-500 mb-4" />
            <h2 className="text-lg font-semibold mb-2">Assistant comptable SYSCOHADA</h2>
            <p className="text-gray-500 mb-6 text-sm">
              Je connais vos KPIs, votre balance et vos dernières écritures.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <Button
                  key={s}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSend(s)}
                  className="text-xs"
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap ${
                msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
              }`}
            >
              {msg.content ||
                (isStreaming && idx === messages.length - 1 ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null)}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2 mt-4">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder="Posez votre question comptable..."
          disabled={isStreaming}
          className="flex-1"
        />
        <Button onClick={() => handleSend()} disabled={isStreaming || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
