import type {
  CreateStockBatchRequest,
  LoteEstoque,
  LoteEstoqueLocal,
  LoteEstoqueProduto,
  LoteEstoqueSetor,
  LoteEstoqueUsuario,
  StatusLoteFiltro,
  UpdateStockBatchRequest,
} from '../types/estoque'
import { apiClient } from './apiClient'

interface BackendLote {
  id: number
  productId: number
  sectorId: number
  initialQuantity: number
  currentQuantity: number
  value: number | string | null
  movementDate: string
  expirationDate: string | null
  notes: string | null
  userId: number
  invoiceAccessKey: string | null
  locationId: number
  isClosed: boolean
  sector: LoteEstoqueSetor
  location: LoteEstoqueLocal
  product?: LoteEstoqueProduto
  user?: LoteEstoqueUsuario
}

function mapBackendLote(item: BackendLote): LoteEstoque {
  return {
    id: item.id,
    productId: item.productId,
    sectorId: item.sectorId,
    initialQuantity: item.initialQuantity,
    currentQuantity: item.currentQuantity,
    value: item.value,
    movementDate: item.movementDate,
    expirationDate: item.expirationDate,
    notes: item.notes,
    userId: item.userId,
    invoiceAccessKey: item.invoiceAccessKey,
    locationId: item.locationId,
    isClosed: item.isClosed,
    sector: item.sector,
    location: item.location,
    product: item.product,
    user: item.user,
  }
}

export function normalizarValorLote(value: number | string | null | undefined): number | null {
  if (value == null || value === '') return null
  const numero = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numero) ? numero : null
}

export async function listarLotes(status: StatusLoteFiltro = 'open'): Promise<LoteEstoque[]> {
  const params = status === 'open' ? undefined : { status }
  const response = await apiClient.get<BackendLote[]>('/stock-batches', { params })
  return response.data.map(mapBackendLote)
}

export async function buscarLote(id: number): Promise<LoteEstoque> {
  const response = await apiClient.get<BackendLote>(`/stock-batches/${id}`)
  return mapBackendLote(response.data)
}

export async function criarLote(payload: CreateStockBatchRequest): Promise<LoteEstoque> {
  const response = await apiClient.post<BackendLote>('/stock-batches', payload)
  return mapBackendLote(response.data)
}

export async function atualizarLote(
  id: number,
  payload: UpdateStockBatchRequest,
): Promise<LoteEstoque> {
  const response = await apiClient.patch<BackendLote>(`/stock-batches/${id}`, payload)
  return mapBackendLote(response.data)
}

export async function fecharLote(id: number): Promise<LoteEstoque> {
  const response = await apiClient.patch<BackendLote>(`/stock-batches/${id}/close`)
  return mapBackendLote(response.data)
}
