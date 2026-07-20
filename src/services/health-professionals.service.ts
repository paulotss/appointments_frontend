import { apiClient } from './apiClient'
import type {
  CouncilType,
  CreateHealthProfessionalRequest,
  HealthProfessional,
  UpdateHealthProfessionalRequest,
} from '../types/profissional'

interface BackendHealthProfessional {
  id: number
  name: string
  specialtyId: number
  councilType: CouncilType
  councilNumber: string
  cpf: string
  phone?: string | null
  email?: string | null
  isActive: boolean
  specialty?: {
    id: number
    name: string
  }
}

function mapBackendHealthProfessional(item: BackendHealthProfessional): HealthProfessional {
  return {
    id: item.id,
    name: item.name,
    specialtyId: item.specialtyId,
    councilType: item.councilType,
    councilNumber: item.councilNumber,
    cpf: item.cpf,
    phone: item.phone ?? null,
    email: item.email ?? null,
    isActive: item.isActive,
    specialty: item.specialty,
  }
}

export async function listarProfissionais(): Promise<HealthProfessional[]> {
  const response = await apiClient.get<BackendHealthProfessional[]>('/health-professionals')
  return response.data.map(mapBackendHealthProfessional)
}

export async function criarProfissional(
  payload: CreateHealthProfessionalRequest,
): Promise<HealthProfessional> {
  const response = await apiClient.post<BackendHealthProfessional>('/health-professionals', payload)
  return mapBackendHealthProfessional(response.data)
}

export async function atualizarProfissional(
  id: number,
  payload: UpdateHealthProfessionalRequest,
): Promise<HealthProfessional> {
  const response = await apiClient.patch<BackendHealthProfessional>(
    `/health-professionals/${id}`,
    payload,
  )
  return mapBackendHealthProfessional(response.data)
}
