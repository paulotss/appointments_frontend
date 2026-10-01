import type {
  Benefit,
  BenefitPlan,
  CreateBenefitPlanRequest,
  UpdateBenefitPlanRequest,
} from '../types/cartao'
import { parseValorDecimal } from '../utils/moedaBRL'
import { apiClient } from './apiClient'

interface BackendProcedureLink {
  id: number
  procedureId: number
  procedure?: { id: number; name: string }
}

interface BackendBenefit {
  id: number
  planId: number
  title: string
  description?: string | null
  kind: Benefit['kind']
  quantity?: number | null
  discountPercent?: string | number | null
  procedures?: BackendProcedureLink[]
}

interface BackendBenefitPlan {
  id: number
  name: string
  annualPrice: string | number
  adhesionFee: string | number
  dependentFee: string | number
  isActive: boolean
  createdAt: string
  benefits?: BackendBenefit[]
}

function mapBenefit(item: BackendBenefit): Benefit {
  return {
    id: item.id,
    planId: item.planId,
    title: item.title,
    description: item.description ?? null,
    kind: item.kind,
    quantity: item.quantity ?? null,
    discountPercent:
      item.discountPercent == null ? null : parseValorDecimal(item.discountPercent) || 0,
    procedures: item.procedures ?? [],
  }
}

export function mapBackendBenefitPlan(item: BackendBenefitPlan): BenefitPlan {
  return {
    id: item.id,
    name: item.name,
    annualPrice: parseValorDecimal(item.annualPrice) || 0,
    adhesionFee: parseValorDecimal(item.adhesionFee) || 0,
    dependentFee: parseValorDecimal(item.dependentFee) || 0,
    isActive: item.isActive,
    createdAt: item.createdAt,
    benefits: (item.benefits ?? []).map(mapBenefit),
  }
}

export async function listarPlanosCartao(params?: { isActive?: boolean }): Promise<BenefitPlan[]> {
  const response = await apiClient.get<BackendBenefitPlan[]>('/benefit-plans', { params })
  return response.data.map(mapBackendBenefitPlan)
}

export async function criarPlanoCartao(payload: CreateBenefitPlanRequest): Promise<BenefitPlan> {
  const response = await apiClient.post<BackendBenefitPlan>('/benefit-plans', payload)
  return mapBackendBenefitPlan(response.data)
}

export async function atualizarPlanoCartao(
  id: number,
  payload: UpdateBenefitPlanRequest,
): Promise<BenefitPlan> {
  const response = await apiClient.patch<BackendBenefitPlan>(`/benefit-plans/${id}`, payload)
  return mapBackendBenefitPlan(response.data)
}

export async function excluirPlanoCartao(id: number): Promise<void> {
  await apiClient.delete(`/benefit-plans/${id}`)
}
