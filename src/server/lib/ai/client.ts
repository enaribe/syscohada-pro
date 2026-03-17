import OpenAI from 'openai'

const apiKey = process.env.OPENROUTER_API_KEY

if (!apiKey && process.env.NODE_ENV === 'production') {
  throw new Error('OPENROUTER_API_KEY manquante — variable serveur obligatoire')
}

export const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: apiKey ?? '',
})

export const AI_MODEL = 'arcee-ai/trinity-large-preview:free'
export const AI_MAX_TOKENS = 2048
