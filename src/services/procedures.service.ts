import type {
  CreateProcedureRequest,
  ListarProcedimentosParams,
  Procedure,
  ProcedureHealthPlanPrice,
  UpdateProcedureRequest,
} from '../types/procedimento'
import type { TissGuideType } from '../types/tiss'
import { apiClient } from './apiClient'

interface BackendSpecialtyRef {
  id: number
  name: string
}

interface BackendHealthPlanRef {
  id: number
  name: string
  submissionDeadlineDays: number
}

interface BackendHealthPlanPrice {
  id: number
  healthPlanId: number
  procedureId: number
  tissCode: string
  value: string | number
  healthPlan?: BackendHealthPlanRef
}

interface BackendProcedure {
  id: number
  specialtyId: number
  name: string
  value: string | number
  tissGuideType?: TissGuideType
  specialty?: BackendSpecialtyRef
  healthPlanPrices?: BackendHealthPlanPrice[]
}

function mapHealthPlanPrice(item: BackendHealthPlanPrice): ProcedureHealthPlanPrice {
  return {
    id: item.id,
    healthPlanId: item.healthPlanId,
    procedureId: item.procedureId,
    tissCode: item.tissCode,
    value: item.value,
    healthPlan: item.healthPlan,
  }
}

function mapBackendProcedure(item: BackendProcedure): Procedure {
  return {
    id: item.id,
    specialtyId: item.specialtyId,
    name: item.name,
    value: item.value,
    tissGuideType: item.tissGuideType === 'consulta' ? 'consulta' : 'sp_sadt',
    specialty: item.specialty,
    healthPlanPrices: (item.healthPlanPrices ?? []).map(mapHealthPlanPrice),
  }
}

export async function listarProcedimentos(params?: ListarProcedimentosParams): Promise<Procedure[]> {
  const response = await apiClient.get<BackendProcedure[]>('/procedures', { params })
  return response.data.map(mapBackendProcedure)
}

export async function listarProcedimentosPorEspecialidades(
  specialtyIds: number[],
): Promise<Procedure[]> {
  const unicos = Array.from(new Set(specialtyIds)).filter((id) => id > 0)
  const listas = await Promise.all(unicos.map((specialtyId) => listarProcedimentos({ specialtyId })))
  const porId = new Map<number, Procedure>()
  for (const lista of listas) {
    for (const item of lista) {
      porId.set(item.id, item)
    }
  }
  return Array.from(porId.values()).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

export async function buscarProcedimento(id: number): Promise<Procedure> {
  const response = await apiClient.get<BackendProcedure>(`/procedures/${id}`)
  return mapBackendProcedure(response.data)
}

export async function criarProcedimento(payload: CreateProcedureRequest): Promise<Procedure> {
  const response = await apiClient.post<BackendProcedure>('/procedures', payload)
  return mapBackendProcedure(response.data)
}

export async function atualizarProcedimento(
  id: number,
  payload: UpdateProcedureRequest,
): Promise<Procedure> {
  const response = await apiClient.patch<BackendProcedure>(`/procedures/${id}`, payload)
  return mapBackendProcedure(response.data)
}

export async function excluirProcedimento(id: number): Promise<void> {
  await apiClient.delete(`/procedures/${id}`)
}
