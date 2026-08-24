import { parseValorDecimal } from '../utils/moedaBRL'

export const PAYMENT_METHODS = ['pix', 'debit', 'credit', 'cash', 'transfer'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pix: 'Pix',
  debit: 'Débito',
  credit: 'Crédito',
  cash: 'Dinheiro',
  transfer: 'Transferência',
}

export const FINANCIAL_ENTRY_TYPES = ['private_procedure', 'health_plan'] as const
export type FinancialEntryType = (typeof FINANCIAL_ENTRY_TYPES)[number]

export const FINANCIAL_ENTRY_TYPE_LABELS: Record<FinancialEntryType, string> = {
  private_procedure: 'Particular',
  health_plan: 'Plano de saúde',
}

export const FINANCIAL_ENTRY_STATUSES = ['pending', 'paid', 'partially_paid', 'cancelled'] as const
export type FinancialEntryStatus = (typeof FINANCIAL_ENTRY_STATUSES)[number]

export const FINANCIAL_ENTRY_STATUS_LABELS: Record<FinancialEntryStatus, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  partially_paid: 'Parcialmente pago',
  cancelled: 'Cancelado',
}

export const PAYABLE_KINDS = ['material', 'service'] as const
export type PayableKind = (typeof PAYABLE_KINDS)[number]

export const PAYABLE_KIND_LABELS: Record<PayableKind, string> = {
  material: 'Material',
  service: 'Serviço',
}

export const PAYABLE_STATUSES = ['pending', 'paid', 'cancelled'] as const
export type PayableStatus = (typeof PAYABLE_STATUSES)[number]

export const PAYABLE_STATUS_LABELS: Record<PayableStatus, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  cancelled: 'Cancelado',
}

export const BILLING_BATCH_STATUSES = ['open', 'billed', 'settled', 'cancelled'] as const
export type BillingBatchStatus = (typeof BILLING_BATCH_STATUSES)[number]

export const BILLING_BATCH_STATUS_LABELS: Record<BillingBatchStatus, string> = {
  open: 'Aberto',
  billed: 'Faturado',
  settled: 'Quitado',
  cancelled: 'Cancelado',
}

export interface FinanceiroRef {
  id: number
  name: string
}

export interface FinanceiroSupplierRef {
  id: number
  legalName: string
  tradeName: string
}

export interface FinancialEntryItem {
  id: number
  financialEntryId: number
  procedureId: number
  quantity: number
  unitValue: number
  description: string
  procedure?: FinanceiroRef
}

export interface FinancialEntryAppointmentRef {
  id: number
  patientId: number
  healthProfessionalId: number
  patient?: FinanceiroRef
  healthProfessional?: FinanceiroRef
}

export interface FinancialEntryBatchRef {
  id: number
  healthPlanId: number
  healthPlan?: FinanceiroRef
}

export interface FinancialEntry {
  id: number
  type: FinancialEntryType
  status: FinancialEntryStatus
  grossAmount: number
  discountAmount: number
  surchargeAmount: number
  amount: number
  receivedAmount: number
  paymentMethod: PaymentMethod | null
  paidAt: string | null
  notes: string | null
  clinicalAppointmentId: number | null
  billingBatchId: number | null
  createdAt: string
  items: FinancialEntryItem[]
  clinicalAppointment?: FinancialEntryAppointmentRef | null
  billingBatch?: FinancialEntryBatchRef | null
}

export interface CreatePrivateFinancialEntryRequest {
  clinicalAppointmentId: number
  paymentMethod: PaymentMethod
  paidAt?: string
  discountAmount?: number
  surchargeAmount?: number
  notes?: string
}

export interface ListarFinancialEntriesParams {
  type?: FinancialEntryType
  status?: FinancialEntryStatus
  from?: string
  to?: string
  page?: number
  limit?: number
}

export interface FinancialExitPayableRef {
  id: number
  description: string
  supplierId: number
  supplier?: FinanceiroSupplierRef
}

export interface FinancialExit {
  id: number
  payableId: number
  amount: number
  paymentMethod: PaymentMethod
  paidAt: string
  createdAt: string
  payable?: FinancialExitPayableRef
}

export interface ListarFinancialExitsParams {
  supplierId?: number
  from?: string
  to?: string
  paymentMethod?: PaymentMethod
  page?: number
  limit?: number
}

export interface Payable {
  id: number
  supplierId: number
  kind: PayableKind
  description: string
  amount: number
  dueDate: string
  invoiceNumber: string | null
  notes: string | null
  status: PayableStatus
  paidAt: string | null
  createdAt: string
  supplier?: FinanceiroSupplierRef
  financialExit?: FinancialExit | null
}

export interface CreatePayableRequest {
  supplierId: number
  kind: PayableKind
  description: string
  amount: number
  dueDate: string
  invoiceNumber?: string
  notes?: string
}

export interface PayPayableRequest {
  paymentMethod: PaymentMethod
  paidAt?: string
}

export interface ListarPayablesParams {
  status?: PayableStatus
  supplierId?: number
  page?: number
  limit?: number
}

export interface BillingBatchGuide {
  id: number
  billingBatchId: number
  insuranceGuideId: number
  billedAmount: number
  receivedAmount: number | null
  glosaReason: string | null
  insuranceGuide?: {
    id: number
    patient?: FinanceiroRef
    healthProfessional?: FinanceiroRef
    expirationDate?: string
    procedures?: Array<{
      value: string | number
      usedQuantity: number
      procedure?: FinanceiroRef
    }>
  }
}

export interface BillingBatch {
  id: number
  healthPlanId: number
  status: BillingBatchStatus
  billedAmount: number
  receivedAmount: number
  billedAt: string | null
  settledAt: string | null
  protocolNumber: string | null
  createdAt: string
  healthPlan?: FinanceiroRef
  guides: BillingBatchGuide[]
  financialEntry?: Pick<FinancialEntry, 'id' | 'status' | 'amount' | 'receivedAmount'> | null
}

export interface CreateBillingBatchRequest {
  healthPlanId: number
  insuranceGuideIds: number[]
  protocolNumber?: string
}

export interface ListarBillingBatchesParams {
  healthPlanId?: number
  status?: BillingBatchStatus
  page?: number
  limit?: number
}

export function mapMoney(value: string | number | null | undefined): number {
  const n = parseValorDecimal(value)
  return Number.isNaN(n) ? 0 : n
}

export function origemEntrada(item: FinancialEntry): string {
  if (item.type === 'private_procedure') {
    return item.clinicalAppointment?.patient?.name ?? 'Particular'
  }
  return item.billingBatch?.healthPlan?.name ?? 'Plano de saúde'
}

export function valorFaturavelGuia(
  procedures: Array<{ value: string | number; usedQuantity: number }>,
): number {
  return procedures.reduce((total, item) => {
    return total + mapMoney(item.value) * item.usedQuantity
  }, 0)
}
