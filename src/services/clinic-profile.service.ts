import { apiClient } from './apiClient'
import type { ClinicProfile, UpsertClinicProfileRequest } from '../types/clinica'

interface BackendClinicProfile {
  id: number
  legalName?: string | null
  cnpj?: string | null
  cnes?: string | null
}

function mapClinicProfile(item: BackendClinicProfile): ClinicProfile {
  return {
    id: item.id,
    legalName: item.legalName ?? null,
    cnpj: item.cnpj ?? null,
    cnes: item.cnes ?? null,
  }
}

export async function buscarPerfilClinica(): Promise<ClinicProfile> {
  const response = await apiClient.get<BackendClinicProfile>('/clinic-profile')
  return mapClinicProfile(response.data)
}

export async function atualizarPerfilClinica(
  payload: UpsertClinicProfileRequest,
): Promise<ClinicProfile> {
  const response = await apiClient.put<BackendClinicProfile>('/clinic-profile', payload)
  return mapClinicProfile(response.data)
}
