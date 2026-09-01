import type { CreateHealthPlanRequest, HealthPlan, UpdateHealthPlanRequest } from '../types/planoSaude'
import { DEFAULT_TISS_VERSION, TISS_VERSIONS } from '../types/tiss'
import { apiClient } from './apiClient'

interface BackendHealthPlan {
  id: number
  name: string
  submissionDeadlineDays: number
  registroAns?: string | null
  providerCode?: string | null
  tissVersion?: string
}

function mapBackendHealthPlan(item: BackendHealthPlan): HealthPlan {
  const version = TISS_VERSIONS.find((value) => value === item.tissVersion)
  return {
    id: item.id,
    name: item.name,
    submissionDeadlineDays: item.submissionDeadlineDays,
    registroAns: item.registroAns ?? null,
    providerCode: item.providerCode ?? null,
    tissVersion: version ?? DEFAULT_TISS_VERSION,
  }
}

export async function listarPlanosSaude(): Promise<HealthPlan[]> {
  const response = await apiClient.get<BackendHealthPlan[]>('/health-plans')
  return response.data.map(mapBackendHealthPlan)
}

export async function criarPlanoSaude(payload: CreateHealthPlanRequest): Promise<HealthPlan> {
  const response = await apiClient.post<BackendHealthPlan>('/health-plans', payload)
  return mapBackendHealthPlan(response.data)
}

export async function atualizarPlanoSaude(
  id: number,
  payload: UpdateHealthPlanRequest,
): Promise<HealthPlan> {
  const response = await apiClient.patch<BackendHealthPlan>(`/health-plans/${id}`, payload)
  return mapBackendHealthPlan(response.data)
}
