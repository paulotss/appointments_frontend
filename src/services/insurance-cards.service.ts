import type { InsuranceCard, InsuranceCardInput } from '../types/paciente'
import { isoDatePrefix } from '../utils/dataISO'
import { apiClient } from './apiClient'

interface BackendPlanRef {
  id: number
  name: string
}

interface BackendInsuranceCard {
  id: number
  patientId: number
  healthPlanId: number
  cardNumber: string
  expirationDate?: string
  healthPlan?: BackendPlanRef
}

export function mapBackendInsuranceCard(item: BackendInsuranceCard): InsuranceCard {
  return {
    id: item.id,
    patientId: item.patientId,
    healthPlanId: item.healthPlanId,
    cardNumber: item.cardNumber,
    expirationDate: isoDatePrefix(item.expirationDate),
    healthPlan: item.healthPlan,
  }
}

export async function listarCarteirinhas(patientId: number): Promise<InsuranceCard[]> {
  const response = await apiClient.get<BackendInsuranceCard[]>('/insurance-cards', {
    params: { patientId },
  })
  return (response.data ?? []).map(mapBackendInsuranceCard)
}

export async function criarCarteirinha(
  patientId: number,
  payload: InsuranceCardInput,
): Promise<InsuranceCard> {
  const response = await apiClient.post<BackendInsuranceCard>('/insurance-cards', {
    patientId,
    healthPlanId: payload.healthPlanId,
    cardNumber: payload.cardNumber,
    expirationDate: payload.expirationDate,
  })
  return mapBackendInsuranceCard(response.data)
}

export async function atualizarCarteirinha(
  id: number,
  payload: InsuranceCardInput,
): Promise<InsuranceCard> {
  const response = await apiClient.patch<BackendInsuranceCard>(`/insurance-cards/${id}`, {
    healthPlanId: payload.healthPlanId,
    cardNumber: payload.cardNumber,
    expirationDate: payload.expirationDate,
  })
  return mapBackendInsuranceCard(response.data)
}

export async function excluirCarteirinha(id: number): Promise<void> {
  await apiClient.delete(`/insurance-cards/${id}`)
}

export async function sincronizarCarteirinhas(
  patientId: number,
  atuais: InsuranceCard[],
  desejadas: InsuranceCardInput[],
): Promise<void> {
  const idsMantidos = new Set(
    desejadas.map((item) => item.id).filter((id): id is number => typeof id === 'number'),
  )
  for (const atual of atuais) {
    if (!idsMantidos.has(atual.id)) {
      await excluirCarteirinha(atual.id)
    }
  }
  for (const item of desejadas) {
    if (item.id != null) {
      await atualizarCarteirinha(item.id, item)
    } else {
      await criarCarteirinha(patientId, item)
    }
  }
}
