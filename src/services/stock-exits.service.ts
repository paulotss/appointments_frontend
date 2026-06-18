import type { CreateStockExitRequest, SaidaEstoque } from '../types/estoque'
import { apiClient } from './apiClient'

interface BackendSaida {
  id: number
  batchId: number
  quantity: number
  userId: number
  exitDate: string
  batch: {
    id: number
    productId: number
    locationId: number
    product?: {
      id: number
      name: string
    }
  }
  user: {
    id: number
    name: string
  }
}

function mapBackendSaida(item: BackendSaida): SaidaEstoque {
  return {
    id: item.id,
    batchId: item.batchId,
    quantity: item.quantity,
    userId: item.userId,
    exitDate: item.exitDate,
    batch: {
      id: item.batch.id,
      productId: item.batch.productId,
      locationId: item.batch.locationId,
      product: item.batch.product,
    },
    user: item.user,
  }
}

export async function listarSaidas(): Promise<SaidaEstoque[]> {
  const response = await apiClient.get<BackendSaida[]>('/stock-exits')
  return response.data.map(mapBackendSaida)
}

export async function criarSaida(payload: CreateStockExitRequest): Promise<SaidaEstoque> {
  const response = await apiClient.post<BackendSaida>('/stock-exits', payload)
  return mapBackendSaida(response.data)
}
