import Anthropic from '@anthropic-ai/sdk'

const apiKey = process.env.ANTHROPIC_API_KEY

if (!apiKey && process.env.NODE_ENV === 'production') {
  throw new Error('ANTHROPIC_API_KEY manquante — variable serveur obligatoire')
}

export const anthropic = new Anthropic({ apiKey: apiKey ?? '' })

export const AI_MODEL = 'claude-sonnet-4-5-20250514'
export const AI_MAX_TOKENS = 2048
