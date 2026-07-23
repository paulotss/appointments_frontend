import type {
  CreateSupplierRequest,
  Fornecedor,
  UpdateSupplierRequest,
} from '../types/estoque'
import { apiClient } from './apiClient'

interface BackendSupplier {
  id: number
  legalName: string
  tradeName: string
  cnpj: string
  phone: string
  email: string
  website?: string | null
}

function mapBackendSupplier(item: BackendSupplier): Fornecedor {
  return {
    id: item.id,
    legalName: item.legalName,
    tradeName: item.tradeName,
    cnpj: item.cnpj,
    phone: item.phone,
    email: item.email,
    website: item.website ?? null,
  }
}

export async function listarFornecedores(): Promise<Fornecedor[]> {
  const response = await apiClient.get<BackendSupplier[]>('/suppliers')
  return response.data.map(mapBackendSupplier)
}

export async function buscarFornecedor(id: number): Promise<Fornecedor> {
  const response = await apiClient.get<BackendSupplier>(`/suppliers/${id}`)
  return mapBackendSupplier(response.data)
}

export async function criarFornecedor(payload: CreateSupplierRequest): Promise<Fornecedor> {
  const response = await apiClient.post<BackendSupplier>('/suppliers', payload)
  return mapBackendSupplier(response.data)
}

export async function atualizarFornecedor(
  id: number,
  payload: UpdateSupplierRequest,
): Promise<Fornecedor> {
  const response = await apiClient.patch<BackendSupplier>(`/suppliers/${id}`, payload)
  return mapBackendSupplier(response.data)
}

export async function excluirFornecedor(id: number): Promise<void> {
  await apiClient.delete(`/suppliers/${id}`)
}
