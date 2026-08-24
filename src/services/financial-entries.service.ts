import type { PagedList } from '../types/listEnvelope'
import {
  mapMoney,
  type CreatePrivateFinancialEntryRequest,
  type FinancialEntry,
  type FinancialEntryItem,
  type ListarFinancialEntriesParams,
} from '../types/financeiro'
import { isoDatePrefix } from '../utils/dataISO'
import { apiClient } from './apiClient'

const META_VAZIA = { page: 1, limit: 50, total: 0, totalPages: 1 }

interface BackendRef {
  id: number
  name: string
}

interface BackendEntryItem {
  id: number
  financialEntryId: number
  procedureId: number
  quantity: number
  unitValue: string | number
  description: string
  procedure?: BackendRef
}

interface BackendAppointment {
  id: number
  patientId: number
  healthProfessionalId: number
  patient?: BackendRef
  healthProfessional?: BackendRef
}

interface BackendBatch {
  id: number
  healthPlanId: number
  healthPlan?: BackendRef
}

interface BackendFinancialEntry {
  id: number
  type: FinancialEntry['type']
  status: FinancialEntry['status']
  grossAmount: string | number
  discountAmount: string | number
  surchargeAmount: string | number
  amount: string | number
  receivedAmount: string | number
  paymentMethod: FinancialEntry['paymentMethod']
  paidAt: string | null
  notes: string | null
  clinicalAppointmentId: number | null
  billingBatchId: number | null
  createdAt: string
  items?: BackendEntryItem[]
  clinicalAppointment?: BackendAppointment | null
  billingBatch?: BackendBatch | null
}

function mapItem(item: BackendEntryItem): FinancialEntryItem {
  return {
    id: item.id,
    financialEntryId: item.financialEntryId,
    procedureId: item.procedureId,
    quantity: item.quantity,
    unitValue: mapMoney(item.unitValue),
    description: item.description,
    procedure: item.procedure,
  }
}

export function mapBackendFinancialEntry(item: BackendFinancialEntry): FinancialEntry {
  return {
    id: item.id,
    type: item.type,
    status: item.status,
    grossAmount: mapMoney(item.grossAmount),
    discountAmount: mapMoney(item.discountAmount),
    surchargeAmount: mapMoney(item.surchargeAmount),
    amount: mapMoney(item.amount),
    receivedAmount: mapMoney(item.receivedAmount),
    paymentMethod: item.paymentMethod ?? null,
    paidAt: item.paidAt,
    notes: item.notes ?? null,
    clinicalAppointmentId: item.clinicalAppointmentId ?? null,
    billingBatchId: item.billingBatchId ?? null,
    createdAt: item.createdAt,
    items: (item.items ?? []).map(mapItem),
    clinicalAppointment: item.clinicalAppointment ?? null,
    billingBatch: item.billingBatch ?? null,
  }
}

export async function listarEntradasFinanceiras(
  params?: ListarFinancialEntriesParams,
): Promise<PagedList<FinancialEntry>> {
  const query = params
    ? {
        ...(params.type != null ? { type: params.type } : {}),
        ...(params.status != null ? { status: params.status } : {}),
        ...(params.from ? { from: isoDatePrefix(params.from) } : {}),
        ...(params.to ? { to: isoDatePrefix(params.to) } : {}),
        ...(params.page != null ? { page: params.page } : {}),
        ...(params.limit != null ? { limit: params.limit } : {}),
      }
    : undefined

  const response = await apiClient.get<PagedList<BackendFinancialEntry>>('/financial-entries', {
    params: query && Object.keys(query).length > 0 ? query : undefined,
  })
  return {
    data: (response.data.data ?? []).map(mapBackendFinancialEntry),
    meta: response.data.meta ?? META_VAZIA,
  }
}

export async function buscarEntradaFinanceira(id: number): Promise<FinancialEntry> {
  const response = await apiClient.get<BackendFinancialEntry>(`/financial-entries/${id}`)
  return mapBackendFinancialEntry(response.data)
}

export async function criarEntradaParticular(
  payload: CreatePrivateFinancialEntryRequest,
): Promise<FinancialEntry> {
  const response = await apiClient.post<BackendFinancialEntry>('/financial-entries', payload)
  return mapBackendFinancialEntry(response.data)
}
