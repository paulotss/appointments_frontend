import type { Message, MessageRecordStatus } from '../types/message'
import { apiClient } from './apiClient'

export async function listarMensagens(): Promise<Message[]> {
  const response = await apiClient.get<Message[]>('/messages')
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
