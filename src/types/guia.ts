export const INSURANCE_GUIDE_STATUSES = ['pending', 'under_analysis', 'authorized'] as const

export type InsuranceGuideStatus = (typeof INSURANCE_GUIDE_STATUSES)[number]

export const INSURANCE_GUIDE_STATUS_LABELS: Record<InsuranceGuideStatus, string> = {
  pending: 'Pendente',
  under_analysis: 'Em análise',
  authorized: 'Autorizada',
}

export interface InsuranceGuideRef {
  id: number
  name: string
}

export interface InsuranceGuidePlanRef extends InsuranceGuideRef {
  submissionDeadlineDays: number
}

export interface InsuranceGuideProcedureRef {
  id: number
  name: string
  value: string | number
  specialtyId: number
  specialty?: InsuranceGuideRef
  healthPlanPrices?: Array<{
    healthPlanId: number
    tissCode: string
    value: string | number
  }>
}

export interface InsuranceGuideProcedure {
  id: number
  insuranceGuideId: number
  procedureId: number
  authorizedQuantity: number
  usedQuantity: number
  value: string | number
  procedure?: InsuranceGuideProcedureRef
}

export interface InsuranceGuideProcedureInput {
  procedureId: number
  authorizedQuantity: number
  value?: number
}

export interface InsuranceGuide {
  id: number
  healthPlanId: number
  patientId: number
  healthProfessionalId: number
  guideNumber: string | null
  expirationDate: string
  isBilled: boolean
  status: InsuranceGuideStatus
  healthPlan?: InsuranceGuidePlanRef
  patient?: InsuranceGuideRef
  healthProfessional?: InsuranceGuideRef
  procedures: InsuranceGuideProcedure[]
}

export interface CreateInsuranceGuideRequest {
  healthPlanId: number
  patientId: number
  healthProfessionalId: number
  guideNumber?: string
  expirationDate?: string
  isBilled?: boolean
  status?: InsuranceGuideStatus
  procedures: InsuranceGuideProcedureInput[]
}

export interface UpdateInsuranceGuideRequest {
  healthPlanId?: number
  patientId?: number
  healthProfessionalId?: number
  guideNumber?: string | null
  expirationDate?: string
  isBilled?: boolean
  status?: InsuranceGuideStatus
  procedures?: InsuranceGuideProcedureInput[]
}

export interface ListarGuiasParams {
  isBilled?: boolean
  status?: InsuranceGuideStatus
  patientId?: number
  healthProfessionalId?: number
  healthPlanId?: number
  availableForBilling?: boolean
  page?: number
  limit?: number
}

export function saldoGuiaProcedimento(item: Pick<InsuranceGuideProcedure, 'authorizedQuantity' | 'usedQuantity'>): number {
  return Math.max(0, item.authorizedQuantity - item.usedQuantity)
}

export function guiaProcedimentosTotalmenteUtilizados(
  procedimentos: Pick<InsuranceGuideProcedure, 'authorizedQuantity' | 'usedQuantity'>[],
): boolean {
  return (
    procedimentos.length > 0 &&
    procedimentos.every((item) => item.usedQuantity === item.authorizedQuantity)
  )
}

export function rotuloGuia(guia: Pick<InsuranceGuide, 'id' | 'healthPlan' | 'status'>): string {
  const plano = guia.healthPlan?.name ?? 'Plano'
  return `#${guia.id} · ${plano} · ${INSURANCE_GUIDE_STATUS_LABELS[guia.status] ?? guia.status}`
}
