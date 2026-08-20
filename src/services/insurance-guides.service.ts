import type {
  CreateInsuranceGuideRequest,
  InsuranceGuide,
  InsuranceGuideProcedure,
  InsuranceGuideStatus,
  ListarGuiasParams,
  UpdateInsuranceGuideRequest,
} from '../types/guia'
import type { PagedList } from '../types/listEnvelope'
import { isoDatePrefix } from '../utils/dataISO'
import { apiClient } from './apiClient'

const META_VAZIA = { page: 1, limit: 50, total: 0, totalPages: 1 }

interface BackendRef {
  id: number
  name: string
}

interface BackendPlanRef extends BackendRef {
  submissionDeadlineDays: number
}

interface BackendHealthPlanPrice {
  healthPlanId: number
  tissCode: string
  value: string | number
}

interface BackendProcedureRef {
  id: number
  name: string
  value: string | number
  specialtyId: number
  specialty?: BackendRef
  healthPlanPrices?: BackendHealthPlanPrice[]
}

interface BackendGuideProcedure {
  id: number
  insuranceGuideId: number
  procedureId: number
  authorizedQuantity: number
  usedQuantity: number
  value: string | number
  procedure?: BackendProcedureRef
}

interface BackendInsuranceGuide {
  id: number
  healthPlanId: number
  patientId: number
  healthProfessionalId: number
  expirationDate: string
  isBilled: boolean
  status: InsuranceGuideStatus
  healthPlan?: BackendPlanRef
  patient?: BackendRef
  healthProfessional?: BackendRef
  procedures?: BackendGuideProcedure[]
}

function mapGuideProcedure(item: BackendGuideProcedure): InsuranceGuideProcedure {
  return {
    id: item.id,
    insuranceGuideId: item.insuranceGuideId,
    procedureId: item.procedureId,
    authorizedQuantity: item.authorizedQuantity,
    usedQuantity: item.usedQuantity,
    value: item.value,
    procedure: item.procedure,
  }
}

export function mapBackendGuide(item: BackendInsuranceGuide): InsuranceGuide {
  return {
    id: item.id,
    healthPlanId: item.healthPlanId,
    patientId: item.patientId,
    healthProfessionalId: item.healthProfessionalId,
    expirationDate: isoDatePrefix(item.expirationDate),
    isBilled: Boolean(item.isBilled),
    status: item.status ?? 'pending',
    healthPlan: item.healthPlan,
    patient: item.patient,
    healthProfessional: item.healthProfessional,
    procedures: (item.procedures ?? []).map(mapGuideProcedure),
  }
}

export async function listarGuias(params?: ListarGuiasParams): Promise<PagedList<InsuranceGuide>> {
  const query = params
    ? {
        ...(params.isBilled !== undefined ? { isBilled: params.isBilled } : {}),
        ...(params.status != null ? { status: params.status } : {}),
        ...(params.patientId != null ? { patientId: params.patientId } : {}),
        ...(params.healthProfessionalId != null ? { healthProfessionalId: params.healthProfessionalId } : {}),
        ...(params.healthPlanId != null ? { healthPlanId: params.healthPlanId } : {}),
        ...(params.page != null ? { page: params.page } : {}),
        ...(params.limit != null ? { limit: params.limit } : {}),
      }
    : undefined

  const response = await apiClient.get<PagedList<BackendInsuranceGuide>>('/insurance-guides', {
    params: query && Object.keys(query).length > 0 ? query : undefined,
  })
  return {
    data: (response.data.data ?? []).map(mapBackendGuide),
    meta: response.data.meta ?? META_VAZIA,
  }
}

export async function buscarGuia(id: number): Promise<InsuranceGuide> {
  const response = await apiClient.get<BackendInsuranceGuide>(`/insurance-guides/${id}`)
  return mapBackendGuide(response.data)
}

export async function criarGuia(payload: CreateInsuranceGuideRequest): Promise<InsuranceGuide> {
  const response = await apiClient.post<BackendInsuranceGuide>('/insurance-guides', payload)
  return mapBackendGuide(response.data)
}

export async function atualizarGuia(
  id: number,
  payload: UpdateInsuranceGuideRequest,
): Promise<InsuranceGuide> {
  const response = await apiClient.patch<BackendInsuranceGuide>(`/insurance-guides/${id}`, payload)
  return mapBackendGuide(response.data)
}

export async function excluirGuia(id: number): Promise<void> {
  await apiClient.delete(`/insurance-guides/${id}`)
}
