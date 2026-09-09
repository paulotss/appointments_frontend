import { apiClient } from './apiClient'

export type PortalRagStatus = {
  available: boolean
}

export type PortalRagAnswer = {
  answer: string
  sources: string[]
}

export async function consultarStatusPortalRag(): Promise<PortalRagStatus> {
  const response = await apiClient.get<PortalRagStatus>('/portal-rag/status', {
    timeout: 8_000,
  })
  return { available: Boolean(response.data?.available) }
}

export async function perguntarPortalRag(question: string): Promise<PortalRagAnswer> {
  const response = await apiClient.post<PortalRagAnswer>(
    '/portal-rag/ask',
    { question },
    { timeout: 180_000 },
  )
  return {
    answer: response.data?.answer ?? '',
    sources: Array.isArray(response.data?.sources) ? response.data.sources : [],
  }
}
