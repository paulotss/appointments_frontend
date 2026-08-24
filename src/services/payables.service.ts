import type { PagedList } from '../types/listEnvelope'
import {
  mapMoney,
  type CreatePayableRequest,
  type ListarPayablesParams,
  type PayPayableRequest,
  type Payable,
  type PaymentMethod,
} from '../types/financeiro'
import { isoDatePrefix } from '../utils/dataISO'
import { apiClient } from './apiClient'
import { mapBackendFinancialExit } from './financial-exits.service'

const META_VAZIA = { page: 1, limit: 50, total: 0, totalPages: 1 }

interface BackendSupplierRef {
  id: number
  legalName: string
  tradeName: string
}

interface BackendFinancialExit {
  id: number
  payableId: number
  amount: string | number
  paymentMethod: PaymentMethod
  paidAt: string
  createdAt: string
}

interface BackendPayable {
  id: number
  supplierId: number
  kind: Payable['kind']
  description: string
  amount: string | number
  dueDate: string
  invoiceNumber: string | null
  notes: string | null
  status: Payable['status']
  paidAt: string | null
  createdAt: string
  supplier?: BackendSupplierRef
  financialExit?: BackendFinancialExit | null
}

function mapPayable(item: BackendPayable): Payable {
  return {
    id: item.id,
    supplierId: item.supplierId,
    kind: item.kind,
    description: item.description,
    amount: mapMoney(item.amount),
    dueDate: isoDatePrefix(item.dueDate),
    invoiceNumber: item.invoiceNumber ?? null,
    notes: item.notes ?? null,
    status: item.status,
    paidAt: item.paidAt,
    createdAt: item.createdAt,
    supplier: item.supplier,
    financialExit: item.financialExit ? mapBackendFinancialExit(item.financialExit) : null,
  }
}

export async function listarPagamentos(params?: ListarPayablesParams): Promise<PagedList<Payable>> {
  const query = params
    ? {
        ...(params.status != null ? { status: params.status } : {}),
        ...(params.supplierId != null ? { supplierId: params.supplierId } : {}),
        ...(params.page != null ? { page: params.page } : {}),
        ...(params.limit != null ? { limit: params.limit } : {}),
      }
    : undefined

  const response = await apiClient.get<PagedList<BackendPayable>>('/payables', {
    params: query && Object.keys(query).length > 0 ? query : undefined,
  })
  return {
    data: (response.data.data ?? []).map(mapPayable),
    meta: response.data.meta ?? META_VAZIA,
  }
}

export async function buscarPagamento(id: number): Promise<Payable> {
  const response = await apiClient.get<BackendPayable>(`/payables/${id}`)
  return mapPayable(response.data)
}

export async function criarPagamento(payload: CreatePayableRequest): Promise<Payable> {
  const response = await apiClient.post<BackendPayable>('/payables', payload)
  return mapPayable(response.data)
}

export async function faturarPagamento(id: number, payload: PayPayableRequest): Promise<Payable> {
  const response = await apiClient.post<BackendPayable>(`/payables/${id}/pay`, payload)
  return mapPayable(response.data)
}
