import type { PagedList } from '../types/listEnvelope'
import {
  mapMoney,
  type FinancialExit,
  type ListarFinancialExitsParams,
} from '../types/financeiro'
import { isoDatePrefix } from '../utils/dataISO'
import { apiClient } from './apiClient'

const META_VAZIA = { page: 1, limit: 50, total: 0, totalPages: 1 }

interface BackendSupplierRef {
  id: number
  legalName: string
  tradeName: string
}

interface BackendPayableRef {
  id: number
  description: string
  supplierId: number
  supplier?: BackendSupplierRef
}

interface BackendFinancialExit {
  id: number
  payableId: number
  amount: string | number
  paymentMethod: FinancialExit['paymentMethod']
  paidAt: string
  createdAt: string
  payable?: BackendPayableRef
}

export function mapBackendFinancialExit(item: BackendFinancialExit): FinancialExit {
  return {
    id: item.id,
    payableId: item.payableId,
    amount: mapMoney(item.amount),
    paymentMethod: item.paymentMethod,
    paidAt: item.paidAt,
    createdAt: item.createdAt,
    payable: item.payable
      ? {
          id: item.payable.id,
          description: item.payable.description,
          supplierId: item.payable.supplierId,
          supplier: item.payable.supplier,
        }
      : undefined,
  }
}

export async function listarSaidasFinanceiras(
  params?: ListarFinancialExitsParams,
): Promise<PagedList<FinancialExit>> {
  const query = params
    ? {
        ...(params.supplierId != null ? { supplierId: params.supplierId } : {}),
        ...(params.from ? { from: isoDatePrefix(params.from) } : {}),
        ...(params.to ? { to: isoDatePrefix(params.to) } : {}),
        ...(params.paymentMethod != null ? { paymentMethod: params.paymentMethod } : {}),
        ...(params.page != null ? { page: params.page } : {}),
        ...(params.limit != null ? { limit: params.limit } : {}),
      }
    : undefined

  const response = await apiClient.get<PagedList<BackendFinancialExit>>('/financial-exits', {
    params: query && Object.keys(query).length > 0 ? query : undefined,
  })
  return {
    data: (response.data.data ?? []).map(mapBackendFinancialExit),
    meta: response.data.meta ?? META_VAZIA,
  }
}

export async function buscarSaidaFinanceira(id: number): Promise<FinancialExit> {
  const response = await apiClient.get<BackendFinancialExit>(`/financial-exits/${id}`)
  return mapBackendFinancialExit(response.data)
}
