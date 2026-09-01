import type { CreatePatientRequest, Patient, UpdatePatientRequest } from '../types/paciente'
import type { ListMeta, PagedList } from '../types/listEnvelope'
import { isoDatePrefix } from '../utils/dataISO'
import { apiClient } from './apiClient'
import { mapBackendInsuranceCard } from './insurance-cards.service'

const META_VAZIA: ListMeta = { page: 1, limit: 50, total: 0, totalPages: 1 }

export interface ListarPacientesParams {
  name?: string
  page?: number
  limit?: number
}

interface BackendPatient {
  id: number
  name: string
  phone: string
  email?: string | null
  birthDate?: string | null
  cpf?: string | null
  insuranceCards?: BackendInsuranceCard[]
}

interface BackendInsuranceCard {
  id: number
  patientId: number
  healthPlanId: number
  cardNumber: string
  expirationDate?: string
  healthPlan?: { id: number; name: string }
}

function mapBackendPatient(item: BackendPatient): Patient {
  return {
    id: item.id,
    name: item.name,
    phone: item.phone,
    email: item.email ?? null,
    birthDate: isoDatePrefix(item.birthDate) || null,
    cpf: item.cpf ?? null,
    insuranceCards: (item.insuranceCards ?? []).map(mapBackendInsuranceCard),
  }
}

export async function listarPacientes(params?: ListarPacientesParams): Promise<PagedList<Patient>> {
  const name = params?.name?.trim()
  const response = await apiClient.get<PagedList<BackendPatient>>('/patients', {
    params: {
      ...(name ? { name } : {}),
      ...(params?.page != null ? { page: params.page } : {}),
      ...(params?.limit != null ? { limit: params.limit } : {}),
    },
  })
  return {
    data: (response.data.data ?? []).map(mapBackendPatient),
    meta: response.data.meta ?? META_VAZIA,
  }
}

export async function buscarPaciente(id: number): Promise<Patient> {
  const response = await apiClient.get<BackendPatient>(`/patients/${id}`)
  return mapBackendPatient(response.data)
}

export async function criarPaciente(payload: CreatePatientRequest): Promise<Patient> {
  const response = await apiClient.post<BackendPatient>('/patients', payload)
  return mapBackendPatient(response.data)
}

export async function atualizarPaciente(id: number, payload: UpdatePatientRequest): Promise<Patient> {
  const response = await apiClient.patch<BackendPatient>(`/patients/${id}`, payload)
  return mapBackendPatient(response.data)
}
