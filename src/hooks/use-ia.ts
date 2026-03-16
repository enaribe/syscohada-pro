'use client'

import { useCallback, useState } from 'react'
import { useAppStore } from '@/store/app.store'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export function useChat() {
  const { entrepriseId, exerciceId } = useAppStore()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)

  const sendMessage = useCallback(
    async (text: string) => {
      const userMsg: ChatMessage = { role: 'user', content: text }
      setMessages((prev) => [...prev, userMsg])
      setIsStreaming(true)

      try {
        const res = await fetch('/api/ia/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            historique: messages.slice(-10),
            tenantId: entrepriseId,
            exerciceId,
          }),
        })

        if (!res.ok || !res.body) {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: "Erreur de communication avec l'IA." },
          ])
          return
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let assistantContent = ''

        setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.slice(6)) as { text: string }
                assistantContent += data.text
                setMessages((prev) => {
                  const updated = [...prev]
                  const last = updated[updated.length - 1]
                  if (last?.role === 'assistant') {
                    updated[updated.length - 1] = { role: 'assistant', content: assistantContent }
                  }
                  return updated
                })
              } catch {
                // skip malformed chunks
              }
            }
          }
        }
      } catch {
        setMessages((prev) => [...prev, { role: 'assistant', content: 'Erreur de connexion.' }])
      } finally {
        setIsStreaming(false)
      }
    },
    [messages, entrepriseId, exerciceId],
  )

  const clearHistory = useCallback(() => {
    setMessages([])
  }, [])

  return { messages, sendMessage, clearHistory, isStreaming }
}
