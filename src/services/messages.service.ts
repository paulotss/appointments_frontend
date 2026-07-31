import type { ListEnvelope } from '../types/listEnvelope'
import type { Message, MessageRecordStatus } from '../types/message'
import { apiClient } from './apiClient'

export type ListarMensagensParams = {
  from: string
  to: string
  recordStatus?: MessageRecordStatus
  userId?: number
  page?: number
  limit?: number
}

export async function listarMensagens(
  params: ListarMensagensParams,
): Promise<ListEnvelope<Message>> {
  const response = await apiClient.get<ListEnvelope<Message>>('/messages', {
    params,
  })
  return response.data
}

export async function atualizarMensagem(
  id: number,
  payload: { recordStatus: MessageRecordStatus; note?: string },
): Promise<void> {
  await apiClient.patch(`/messages/${id}`, payload)
}

export async function buscarMensagemPorId(id: number): Promise<Message> {
  const response = await apiClient.get<Message>(`/messages/${id}`)
  return response.data
}
