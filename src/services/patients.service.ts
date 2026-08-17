import type { CreatePatientRequest, Patient, UpdatePatientRequest } from '../types/paciente'
import { isoDatePrefix } from '../utils/dataISO'
import { apiClient } from './apiClient'

interface BackendPatient {
  id: number
  name: string
  phone: string
  email?: string | null
  birthDate?: string | null
  cpf?: string | null
}

function mapBackendPatient(item: BackendPatient): Patient {
  return {
    id: item.id,
    name: item.name,
    phone: item.phone,
    email: item.email ?? null,
    birthDate: isoDatePrefix(item.birthDate) || null,
    cpf: item.cpf ?? null,
  }
}

export async function listarPacientes(): Promise<Patient[]> {
  const response = await apiClient.get<BackendPatient[]>('/patients')
  return response.data.map(mapBackendPatient)
}

export async function criarPaciente(payload: CreatePatientRequest): Promise<Patient> {
  const response = await apiClient.post<BackendPatient>('/patients', payload)
  return mapBackendPatient(response.data)
}

export async function atualizarPaciente(id: number, payload: UpdatePatientRequest): Promise<Patient> {
  const response = await apiClient.patch<BackendPatient>(`/patients/${id}`, payload)
  return mapBackendPatient(response.data)
}
