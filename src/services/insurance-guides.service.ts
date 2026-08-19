import type {
  CreateInsuranceGuideRequest,
  InsuranceGuide,
  InsuranceGuideProcedure,
  InsuranceGuideStatus,
  ListarGuiasParams,
  UpdateInsuranceGuideRequest,
} from '../types/guia'
import { isoDatePrefix } from '../utils/dataISO'
import { apiClient } from './apiClient'

interface BackendRef {
  id: number
  name: string
}

interface BackendPlanRef extends BackendRef {
  submissionDeadlineDays: number
}

interface BackendProcedureRef {
  id: number
  name: string
  tissCode: string
  value: string | number
  specialtyId: number
  specialty?: BackendRef
}

interface BackendGuideProcedure {
  id: number
  insuranceGuideId: number
  procedureId: number
  authorizedQuantity: number
  usedQuantity: number
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

export async function listarGuias(params?: ListarGuiasParams): Promise<InsuranceGuide[]> {
  // O backend trata qualquer valor de isBilled na query como true (Boolean("false") === true).
  // Enviamos os demais filtros e aplicamos isBilled no cliente.
  const query = params
    ? {
        ...(params.status != null ? { status: params.status } : {}),
        ...(params.patientId != null ? { patientId: params.patientId } : {}),
        ...(params.healthProfessionalId != null ? { healthProfessionalId: params.healthProfessionalId } : {}),
        ...(params.healthPlanId != null ? { healthPlanId: params.healthPlanId } : {}),
      }
    : undefined

  const response = await apiClient.get<BackendInsuranceGuide[]>('/insurance-guides', {
    params: query && Object.keys(query).length > 0 ? query : undefined,
  })
  let data = response.data.map(mapBackendGuide)
  if (params?.isBilled !== undefined) {
    data = data.filter((item) => item.isBilled === params.isBilled)
  }
  return data
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
