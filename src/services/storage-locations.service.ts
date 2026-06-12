import type {
  CreateStorageLocationRequest,
  LocalArmazenamento,
  UpdateStorageLocationRequest,
} from '../types/estoque'
import { apiClient } from './apiClient'

interface BackendStorageLocation {
  id: number
  name: string
}

function mapBackendStorageLocation(item: BackendStorageLocation): LocalArmazenamento {
  return {
    id: item.id,
    nome: item.name,
  }
}

export async function listarLocais(): Promise<LocalArmazenamento[]> {
  const response = await apiClient.get<BackendStorageLocation[]>('/storage-locations')
  return response.data.map(mapBackendStorageLocation)
}

export async function criarLocal(payload: CreateStorageLocationRequest): Promise<LocalArmazenamento> {
  const response = await apiClient.post<BackendStorageLocation>('/storage-locations', payload)
  return mapBackendStorageLocation(response.data)
}

export async function atualizarLocal(
  id: number,
  payload: UpdateStorageLocationRequest,
): Promise<LocalArmazenamento> {
  const response = await apiClient.patch<BackendStorageLocation>(
    `/storage-locations/${id}`,
    payload,
  )
  return mapBackendStorageLocation(response.data)
}

export async function excluirLocal(id: number): Promise<void> {
  await apiClient.delete(`/storage-locations/${id}`)
}
