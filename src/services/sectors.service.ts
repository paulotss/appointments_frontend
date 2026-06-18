import type { CreateSectorRequest, Setor, UpdateSectorRequest } from '../types/estoque'
import { apiClient } from './apiClient'

interface BackendSector {
  id: number
  name: string
  isActive: boolean
}

function mapBackendSector(item: BackendSector): Setor {
  return {
    id: item.id,
    nome: item.name,
    isActive: item.isActive,
  }
}

export async function listarSetores(): Promise<Setor[]> {
  const response = await apiClient.get<BackendSector[]>('/sectors')
  return response.data.map(mapBackendSector)
}

export async function criarSetor(payload: CreateSectorRequest): Promise<Setor> {
  const response = await apiClient.post<BackendSector>('/sectors', payload)
  return mapBackendSector(response.data)
}

export async function atualizarSetor(id: number, payload: UpdateSectorRequest): Promise<Setor> {
  const response = await apiClient.patch<BackendSector>(`/sectors/${id}`, payload)
  return mapBackendSector(response.data)
}

export async function excluirSetor(id: number): Promise<void> {
  await apiClient.delete(`/sectors/${id}`)
}
