import type { Call, CallRecordStatus, CallStatus } from '../types/call'
import type { ListEnvelope } from '../types/listEnvelope'
import { apiClient } from './apiClient'

export type ListarChamadasParams = {
  from: string
  to: string
  recordStatus?: CallRecordStatus
  userId?: number
  statuses?: CallStatus[]
  page?: number
  limit?: number
}

export async function listarChamadas(
  params: ListarChamadasParams,
): Promise<ListEnvelope<Call>> {
  const { statuses, ...rest } = params
  const response = await apiClient.get<ListEnvelope<Call>>('/calls', {
    params: {
      ...rest,
      ...(statuses?.length ? { statuses: statuses.join(',') } : {}),
    },
  })
  return response.data
}

export async function atualizarChamada(
  id: number,
  payload: { recordStatus: CallRecordStatus; note?: string },
): Promise<void> {
  await apiClient.patch(`/calls/${id}`, payload)
}

export async function buscarChamadaPorId(id: number): Promise<Call> {
  const response = await apiClient.get<Call>(`/calls/${id}`)
  return response.data
}
