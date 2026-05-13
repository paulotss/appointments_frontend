import type { Call, CallRecordStatus } from '../types/call'
import { apiClient } from './apiClient'

export async function listarChamadas(): Promise<Call[]> {
  const response = await apiClient.get<Call[]>('/calls')
  return response.data
}

export async function atualizarChamada(
  id: number,
  payload: { recordStatus: CallRecordStatus; note?: string },
): Promise<void> {
  await apiClient.patch(`/calls/${id}`, payload)
}
