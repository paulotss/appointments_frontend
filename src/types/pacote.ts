export interface ProcedurePackageItem {
  id: number
  packageId: number
  procedureId: number
  quantity: number
  procedure?: {
    id: number
    name: string
    value: string | number
    specialtyId: number
  }
}

export interface ProcedurePackage {
  id: number
  name: string
  discountPercent: number
  isActive: boolean
  createdAt: string
  items: ProcedurePackageItem[]
}

export interface ProcedurePackageItemInput {
  procedureId: number
  quantity: number
}

export interface CreateProcedurePackageRequest {
  name: string
  discountPercent: number
  isActive?: boolean
  items: ProcedurePackageItemInput[]
}

export type UpdateProcedurePackageRequest = Partial<CreateProcedurePackageRequest>

export const PATIENT_PACKAGE_STATUSES = ['active', 'exhausted', 'cancelled'] as const
export type PatientPackageStatus = (typeof PATIENT_PACKAGE_STATUSES)[number]

export const PATIENT_PACKAGE_STATUS_LABELS: Record<PatientPackageStatus, string> = {
  active: 'Ativo',
  exhausted: 'Esgotado',
  cancelled: 'Cancelado',
}

export interface PatientPackageItem {
  id: number
  patientPackageId: number
  procedureId: number
  quantity: number
  usedQuantity: number
  unitValue: number
  remainingQuantity: number
  reservedQuantity: number
  procedure?: {
    id: number
    name: string
    value: string | number
    specialtyId: number
  }
}

export interface PatientPackage {
  id: number
  patientId: number
  packageId: number
  status: PatientPackageStatus
  assignedAt: string
  package?: Pick<ProcedurePackage, 'id' | 'name' | 'discountPercent'>
  patient?: { id: number; name: string }
  items: PatientPackageItem[]
}

export interface CreatePatientPackageRequest {
  patientId: number
  packageId: number
  paymentMethod: 'pix' | 'debit' | 'credit' | 'cash' | 'transfer'
  paidAt?: string
  notes?: string
}

export function aplicarDescontoPercentual(valor: number, percent: number): number {
  return Math.round((Math.round(valor * 100) * (100 - percent)) / 100) / 100
}
