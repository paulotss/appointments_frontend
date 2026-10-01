import type {
  BenefitCardPatient,
  BenefitEntitlement,
  BenefitInstallment,
  BenefitSubscription,
  CreateBenefitSubscriptionRequest,
} from '../types/cartao'
import { mapMoney } from '../types/financeiro'
import { apiClient } from './apiClient'

interface BackendEntitlement {
  id: number
  kind: BenefitEntitlement['kind']
  title: string
  quantity?: number | null
  usedQuantity: number
  discountPercent?: string | number | null
  reservedQuantity?: number
  remainingQuantity?: number | null
  procedures?: BenefitEntitlement['procedures']
  notes?: BenefitEntitlement['notes']
}

interface BackendSubscription {
  id: number
  patientId: number
  planId: number
  startsAt: string
  expiresAt: string
  billingDay: number
  installmentCount: number
  status: BenefitSubscription['status']
  cardNumber: string
  isCurrent: boolean
  discountPercent?: string | number | null
  patient?: { id: number; name: string; cpf?: string | null }
  plan?: { id: number; name: string }
  dependents?: BenefitSubscription['dependents']
  entitlements?: BackendEntitlement[]
  financialEntries?: Array<{
    id: number
    status: BenefitInstallment['status']
    amount: string | number
    dueDate?: string | null
    installmentNumber?: number | null
    paidAt?: string | null
    paymentMethod?: string | null
  }>
}

function mapPatient(
  patient?: { id: number; name: string; cpf?: string | null },
): BenefitCardPatient | undefined {
  if (!patient) return undefined
  return { id: patient.id, name: patient.name, cpf: patient.cpf ?? null }
}

function mapEntitlement(item: BackendEntitlement): BenefitEntitlement {
  return {
    id: item.id,
    kind: item.kind,
    title: item.title,
    quantity: item.quantity ?? null,
    usedQuantity: item.usedQuantity,
    discountPercent: item.discountPercent == null ? null : mapMoney(item.discountPercent),
    reservedQuantity: item.reservedQuantity ?? 0,
    remainingQuantity: item.remainingQuantity ?? null,
    procedures: item.procedures ?? [],
    notes: item.notes ?? [],
  }
}

function mapSubscription(item: BackendSubscription): BenefitSubscription {
  return {
    id: item.id,
    patientId: item.patientId,
    planId: item.planId,
    startsAt: item.startsAt,
    expiresAt: item.expiresAt,
    billingDay: item.billingDay,
    installmentCount: item.installmentCount,
    status: item.status,
    cardNumber: item.cardNumber,
    isCurrent: item.isCurrent,
    discountPercent: item.discountPercent == null ? null : mapMoney(item.discountPercent),
    patient: mapPatient(item.patient),
    plan: item.plan,
    dependents: (item.dependents ?? []).map((dependent) => ({
      id: dependent.id,
      patientId: dependent.patientId,
      patient: mapPatient(dependent.patient),
    })),
    entitlements: (item.entitlements ?? []).map(mapEntitlement),
    financialEntries: (item.financialEntries ?? []).map((entry) => ({
      id: entry.id,
      status: entry.status,
      amount: mapMoney(entry.amount),
      dueDate: entry.dueDate ?? null,
      installmentNumber: entry.installmentNumber ?? null,
      paidAt: entry.paidAt ?? null,
      paymentMethod: entry.paymentMethod ?? null,
    })),
  }
}

export async function listarAssinaturasDoPaciente(
  patientId: number,
  excludeAppointmentId?: number,
): Promise<BenefitSubscription[]> {
  const response = await apiClient.get<BackendSubscription[]>('/benefit-subscriptions', {
    params: {
      patientId,
      ...(excludeAppointmentId != null ? { excludeAppointmentId } : {}),
    },
  })
  return response.data.map(mapSubscription)
}

export async function aderirCartao(
  payload: CreateBenefitSubscriptionRequest,
): Promise<BenefitSubscription> {
  const response = await apiClient.post<BackendSubscription>('/benefit-subscriptions', payload)
  return mapSubscription(response.data)
}

export async function cancelarAssinatura(id: number): Promise<BenefitSubscription> {
  const response = await apiClient.post<BackendSubscription>(`/benefit-subscriptions/${id}/cancel`)
  return mapSubscription(response.data)
}

export async function adicionarDependente(
  subscriptionId: number,
  patientId: number,
): Promise<BenefitSubscription> {
  const response = await apiClient.post<BackendSubscription>(
    `/benefit-subscriptions/${subscriptionId}/dependents`,
    { patientId },
  )
  return mapSubscription(response.data)
}

export async function removerDependente(
  subscriptionId: number,
  patientId: number,
): Promise<BenefitSubscription> {
  const response = await apiClient.delete<BackendSubscription>(
    `/benefit-subscriptions/${subscriptionId}/dependents/${patientId}`,
  )
  return mapSubscription(response.data)
}

export async function anotarBeneficio(
  subscriptionId: number,
  entitlementId: number,
  description: string,
): Promise<BenefitSubscription> {
  const response = await apiClient.post<BackendSubscription>(
    `/benefit-subscriptions/${subscriptionId}/entitlements/${entitlementId}/notes`,
    { description },
  )
  return mapSubscription(response.data)
}
