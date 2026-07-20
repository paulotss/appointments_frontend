import type {
  CreateProductRequest,
  ProdutoConfig,
  ProdutoEstoqueConsolidado,
  StockUnit,
  UpdateProductRequest,
} from '../types/estoque'
import { apiClient } from './apiClient'

interface BackendProduct {
  id: number
  name: string
  sku: string
  categoryId: number
  minimumStock: number
  baseUnit: StockUnit
  unitsPerPackage: number
  isActive: boolean
}

function mapBackendProduct(item: BackendProduct): ProdutoConfig {
  return {
    id: item.id,
    nome: item.name,
    sku: item.sku,
    categoryId: item.categoryId,
    minimumStock: item.minimumStock,
    baseUnit: item.baseUnit ?? 'UNIT',
    unitsPerPackage: item.unitsPerPackage ?? 1,
    isActive: item.isActive,
  }
}

export async function listarProdutos(): Promise<ProdutoConfig[]> {
  const response = await apiClient.get<BackendProduct[]>('/products')
  return response.data.map(mapBackendProduct)
}

export async function criarProduto(payload: CreateProductRequest): Promise<ProdutoConfig> {
  const response = await apiClient.post<BackendProduct>('/products', payload)
  return mapBackendProduct(response.data)
}

export async function atualizarProduto(
  id: number,
  payload: UpdateProductRequest,
): Promise<ProdutoConfig> {
  const response = await apiClient.patch<BackendProduct>(`/products/${id}`, payload)
  return mapBackendProduct(response.data)
}

export async function excluirProduto(id: number): Promise<void> {
  await apiClient.delete(`/products/${id}`)
}

export async function listarEstoqueConsolidado(): Promise<ProdutoEstoqueConsolidado[]> {
  const response = await apiClient.get<ProdutoEstoqueConsolidado[]>('/products/stock-consolidation')
  return response.data
}
