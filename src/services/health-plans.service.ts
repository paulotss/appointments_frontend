import type { CreateHealthPlanRequest, HealthPlan, UpdateHealthPlanRequest } from '../types/planoSaude'
import { apiClient } from './apiClient'

interface BackendHealthPlan {
  id: number
  name: string
  submissionDeadlineDays: number
}

function mapBackendHealthPlan(item: BackendHealthPlan): HealthPlan {
  return {
    id: item.id,
    name: item.name,
    submissionDeadlineDays: item.submissionDeadlineDays,
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
