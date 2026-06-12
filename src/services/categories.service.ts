import type {
  Categoria,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '../types/estoque'
import { apiClient } from './apiClient'

interface BackendCategory {
  id: number
  name: string
}

function mapBackendCategory(item: BackendCategory): Categoria {
  return {
    id: item.id,
    nome: item.name,
  }
}

export async function listarCategorias(): Promise<Categoria[]> {
  const response = await apiClient.get<BackendCategory[]>('/categories')
  return response.data.map(mapBackendCategory)
}

export async function criarCategoria(payload: CreateCategoryRequest): Promise<Categoria> {
  const response = await apiClient.post<BackendCategory>('/categories', payload)
  return mapBackendCategory(response.data)
}

export async function atualizarCategoria(
  id: number,
  payload: UpdateCategoryRequest,
): Promise<Categoria> {
  const response = await apiClient.patch<BackendCategory>(`/categories/${id}`, payload)
  return mapBackendCategory(response.data)
}

export async function excluirCategoria(id: number): Promise<void> {
  await apiClient.delete(`/categories/${id}`)
}
