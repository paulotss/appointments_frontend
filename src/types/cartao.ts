export const BENEFIT_KINDS = ['quota', 'discount'] as const
export type BenefitKind = (typeof BENEFIT_KINDS)[number]

export const BENEFIT_KIND_LABELS: Record<BenefitKind, string> = {
  quota: 'Cota',
  discount: 'Desconto',
}

export const BENEFIT_SUBSCRIPTION_STATUSES = ['active', 'cancelled'] as const
export type BenefitSubscriptionStatus = (typeof BENEFIT_SUBSCRIPTION_STATUSES)[number]

export const BENEFIT_SUBSCRIPTION_STATUS_LABELS: Record<BenefitSubscriptionStatus, string> = {
  active: 'Ativa',
  cancelled: 'Cancelada',
}

export interface BenefitProcedureLink {
  id: number
  procedureId: number
  procedure?: { id: number; name: string }
}

export interface Benefit {
  id: number
  planId: number
  title: string
  description: string | null
  kind: BenefitKind
  quantity: number | null
  discountPercent: number | null
  procedures: BenefitProcedureLink[]
}

export interface BenefitPlan {
  id: number
  name: string
  annualPrice: number
  adhesionFee: number
  dependentFee: number
  isActive: boolean
  createdAt: string
  benefits: Benefit[]
}

export interface BenefitInput {
  title: string
  description?: string
  kind: BenefitKind
  quantity?: number
  discountPercent?: number
  procedureIds?: number[]
}

export interface CreateBenefitPlanRequest {
  name: string
  annualPrice: number
  adhesionFee?: number
  dependentFee?: number
  isActive?: boolean
  benefits: BenefitInput[]
}

export type UpdateBenefitPlanRequest = Partial<CreateBenefitPlanRequest>

export interface BenefitNote {
  id: number
  description: string
  createdAt: string
}

export interface BenefitEntitlement {
  id: number
  kind: BenefitKind
  title: string
  quantity: number | null
  usedQuantity: number
  discountPercent: number | null
  reservedQuantity: number
  remainingQuantity: number | null
  procedures: BenefitProcedureLink[]
  notes: BenefitNote[]
}

export interface BenefitCardPatient {
  id: number
  name: string
  cpf: string | null
}

export interface BenefitSubscriptionDependent {
  id: number
  patientId: number
  patient?: BenefitCardPatient
}

export interface BenefitInstallment {
  id: number
  status: 'pending' | 'paid' | 'partially_paid' | 'cancelled'
  amount: number
  dueDate: string | null
  installmentNumber: number | null
  paidAt: string | null
  paymentMethod: string | null
}

export interface BenefitSubscription {
  id: number
  patientId: number
  planId: number
  startsAt: string
  expiresAt: string
  billingDay: number
  installmentCount: number
  status: BenefitSubscriptionStatus
  cardNumber: string
  isCurrent: boolean
  discountPercent: number | null
  patient?: BenefitCardPatient
  plan?: { id: number; name: string }
  dependents: BenefitSubscriptionDependent[]
  entitlements: BenefitEntitlement[]
  financialEntries: BenefitInstallment[]
}

export interface CreateBenefitSubscriptionRequest {
  patientId: number
  planId: number
  startsAt: string
  billingDay: number
  installmentCount: number
  dependentPatientIds?: number[]
}
