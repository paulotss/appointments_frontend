import type { PagedList } from '../types/listEnvelope'
import {
  mapMoney,
  type BillingBatch,
  type BillingBatchGuide,
  type CreateBillingBatchRequest,
  type ListarBillingBatchesParams,
} from '../types/financeiro'
import { isoDatePrefix } from '../utils/dataISO'
import { apiClient } from './apiClient'

const META_VAZIA = { page: 1, limit: 50, total: 0, totalPages: 1 }

interface BackendRef {
  id: number
  name: string
}

interface BackendGuideProcedure {
  value: string | number
  usedQuantity: number
  procedure?: BackendRef
}

interface BackendGuide {
  id: number
  patient?: BackendRef
  healthProfessional?: BackendRef
  expirationDate?: string
  procedures?: BackendGuideProcedure[]
}

interface BackendBatchGuide {
  id: number
  billingBatchId: number
  insuranceGuideId: number
  billedAmount: string | number
  receivedAmount: string | number | null
  glosaReason: string | null
  insuranceGuide?: BackendGuide
}

interface BackendFinancialEntryRef {
  id: number
  status: NonNullable<BillingBatch['financialEntry']>['status']
  amount: string | number
  receivedAmount: string | number
}

interface BackendBillingBatch {
  id: number
  healthPlanId: number
  status: BillingBatch['status']
  billedAmount: string | number
  receivedAmount: string | number
  billedAt: string | null
  settledAt: string | null
  protocolNumber: string | null
  createdAt: string
  healthPlan?: BackendRef
  guides?: BackendBatchGuide[]
  financialEntry?: BackendFinancialEntryRef | null
}

function mapGuide(item: BackendBatchGuide): BillingBatchGuide {
  return {
    id: item.id,
    billingBatchId: item.billingBatchId,
    insuranceGuideId: item.insuranceGuideId,
    billedAmount: mapMoney(item.billedAmount),
    receivedAmount: item.receivedAmount == null ? null : mapMoney(item.receivedAmount),
    glosaReason: item.glosaReason ?? null,
    insuranceGuide: item.insuranceGuide
      ? {
          id: item.insuranceGuide.id,
          patient: item.insuranceGuide.patient,
          healthProfessional: item.insuranceGuide.healthProfessional,
          expirationDate: item.insuranceGuide.expirationDate
            ? isoDatePrefix(item.insuranceGuide.expirationDate)
            : undefined,
          procedures: item.insuranceGuide.procedures,
        }
      : undefined,
  }
}

export function mapBackendBillingBatch(item: BackendBillingBatch): BillingBatch {
  return {
    id: item.id,
    healthPlanId: item.healthPlanId,
    status: item.status,
    billedAmount: mapMoney(item.billedAmount),
    receivedAmount: mapMoney(item.receivedAmount),
    billedAt: item.billedAt,
    settledAt: item.settledAt,
    protocolNumber: item.protocolNumber ?? null,
    createdAt: item.createdAt,
    healthPlan: item.healthPlan,
    guides: (item.guides ?? []).map(mapGuide),
    financialEntry: item.financialEntry
      ? {
          id: item.financialEntry.id,
          status: item.financialEntry.status,
          amount: mapMoney(item.financialEntry.amount),
          receivedAmount: mapMoney(item.financialEntry.receivedAmount),
        }
      : null,
  }
}

export async function listarLotesTiss(
  params?: ListarBillingBatchesParams,
): Promise<PagedList<BillingBatch>> {
  const query = params
    ? {
        ...(params.healthPlanId != null ? { healthPlanId: params.healthPlanId } : {}),
        ...(params.status != null ? { status: params.status } : {}),
        ...(params.page != null ? { page: params.page } : {}),
        ...(params.limit != null ? { limit: params.limit } : {}),
      }
    : undefined

  const response = await apiClient.get<PagedList<BackendBillingBatch>>('/billing-batches', {
    params: query && Object.keys(query).length > 0 ? query : undefined,
  })
  return {
    data: (response.data.data ?? []).map(mapBackendBillingBatch),
    meta: response.data.meta ?? META_VAZIA,
  }
}

export async function buscarLoteTiss(id: number): Promise<BillingBatch> {
  const response = await apiClient.get<BackendBillingBatch>(`/billing-batches/${id}`)
  return mapBackendBillingBatch(response.data)
}

export async function criarLoteTiss(payload: CreateBillingBatchRequest): Promise<BillingBatch> {
  const response = await apiClient.post<BackendBillingBatch>('/billing-batches', payload)
  return mapBackendBillingBatch(response.data)
}

export async function faturarLoteTiss(id: number): Promise<BillingBatch> {
  const response = await apiClient.post<BackendBillingBatch>(`/billing-batches/${id}/bill`)
  return mapBackendBillingBatch(response.data)
}
