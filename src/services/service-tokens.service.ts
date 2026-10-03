import { apiClient } from './apiClient'

export const SERVICE_TOKEN_SCOPES = ['CALLS_WRITE', 'AGENT_DATA_READ'] as const

export type ServiceTokenScope = (typeof SERVICE_TOKEN_SCOPES)[number]

export const SERVICE_TOKEN_SCOPE_LABELS: Record<ServiceTokenScope, string> = {
  CALLS_WRITE: 'Registrar ligações (tarifador)',
  AGENT_DATA_READ: 'Ler dados do agente (MCP)',
}

export interface ServiceAccessToken {
  id: number
  name: string
  scopes: ServiceTokenScope[]
  expiresAt: string | null
  revokedAt: string | null
  createdAt: string
  createdById: number
}

export interface CreatedServiceAccessToken extends ServiceAccessToken {
  token: string
}

export async function listarTokensServico(): Promise<ServiceAccessToken[]> {
  const response = await apiClient.get<ServiceAccessToken[]>('/auth/service-tokens')
  return response.data
}

export async function criarTokenServico(payload: {
  name: string
  scopes: ServiceTokenScope[]
  expiresInDays?: number
}): Promise<CreatedServiceAccessToken> {
  const response = await apiClient.post<CreatedServiceAccessToken>('/auth/service-tokens', payload)
  return response.data
}

export async function revogarTokenServico(id: number): Promise<void> {
  await apiClient.delete(`/auth/service-tokens/${id}`)
}
