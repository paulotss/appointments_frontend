import { apiClient } from './apiClient'
import type { ListMeta, PagedList } from '../types/listEnvelope'
import type {
  CouncilType,
  CreateHealthProfessionalRequest,
  HealthProfessional,
  HealthProfessionalSpecialtyLink,
  UpdateHealthProfessionalRequest,
} from '../types/profissional'

const META_VAZIA: ListMeta = { page: 1, limit: 50, total: 0, totalPages: 1 }

export interface ListarProfissionaisParams {
  name?: string
  page?: number
  limit?: number
}

interface BackendSpecialtyRef {
  id: number
  name: string
}

interface BackendHealthProfessionalSpecialty {
  specialtyId: number
  specialty?: BackendSpecialtyRef
}

interface BackendHealthProfessional {
  id: number
  name: string
  councilType: CouncilType
  councilNumber: string
  cpf: string
  phone?: string | null
  email?: string | null
  isActive: boolean
  specialties?: BackendHealthProfessionalSpecialty[]
}

function mapSpecialtyLink(item: BackendHealthProfessionalSpecialty): HealthProfessionalSpecialtyLink {
  return {
    specialtyId: item.specialtyId,
    specialty: item.specialty,
  }
}

function mapBackendHealthProfessional(item: BackendHealthProfessional): HealthProfessional {
  return {
    id: item.id,
    name: item.name,
    councilType: item.councilType,
    councilNumber: item.councilNumber,
    cpf: item.cpf,
    phone: item.phone ?? null,
    email: item.email ?? null,
    isActive: item.isActive,
    specialties: (item.specialties ?? []).map(mapSpecialtyLink),
  }
}

export async function listarProfissionais(
  params?: ListarProfissionaisParams,
): Promise<PagedList<HealthProfessional>> {
  const name = params?.name?.trim()
  const response = await apiClient.get<PagedList<BackendHealthProfessional>>('/health-professionals', {
    params: {
      ...(name ? { name } : {}),
      ...(params?.page != null ? { page: params.page } : {}),
      ...(params?.limit != null ? { limit: params.limit } : {}),
    },
  })
  return {
    data: (response.data.data ?? []).map(mapBackendHealthProfessional),
    meta: response.data.meta ?? META_VAZIA,
  }
}

export async function buscarProfissional(id: number): Promise<HealthProfessional> {
  const response = await apiClient.get<BackendHealthProfessional>(`/health-professionals/${id}`)
  return mapBackendHealthProfessional(response.data)
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
