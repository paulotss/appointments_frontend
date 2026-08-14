import type {
  CreateInsuranceGuideRequest,
  InsuranceGuide,
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

interface BackendInsuranceGuide {
  id: number
  healthPlanId: number
  patientId: number
  specialtyId: number
  healthProfessionalId: number
  quantity: number
  expirationDate: string
  isBilled: boolean
  healthPlan?: BackendPlanRef
  patient?: BackendRef
  specialty?: BackendRef
  healthProfessional?: BackendRef
}

function mapBackendGuide(item: BackendInsuranceGuide): InsuranceGuide {
  return {
    id: item.id,
    healthPlanId: item.healthPlanId,
    patientId: item.patientId,
    specialtyId: item.specialtyId,
    healthProfessionalId: item.healthProfessionalId,
    quantity: item.quantity,
    expirationDate: isoDatePrefix(item.expirationDate),
    isBilled: Boolean(item.isBilled),
    healthPlan: item.healthPlan,
    patient: item.patient,
    specialty: item.specialty,
    healthProfessional: item.healthProfessional,
  }
}

export async function listarGuias(params?: ListarGuiasParams): Promise<InsuranceGuide[]> {
  const response = await apiClient.get<BackendInsuranceGuide[]>('/insurance-guides', {
    params: params?.isBilled === undefined ? undefined : { isBilled: params.isBilled },
  })
  return response.data.map(mapBackendGuide)
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
