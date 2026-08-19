export interface ProcedureSpecialtyRef {
  id: number
  name: string
}

export interface ProcedureHealthPlanRef {
  id: number
  name: string
  submissionDeadlineDays: number
}

export interface ProcedureHealthPlanPrice {
  id: number
  healthPlanId: number
  procedureId: number
  value: string | number
  healthPlan?: ProcedureHealthPlanRef
}

export interface Procedure {
  id: number
  specialtyId: number
  tissCode: string
  name: string
  value: string | number
  specialty?: ProcedureSpecialtyRef
  healthPlanPrices: ProcedureHealthPlanPrice[]
}

export interface HealthPlanPriceInput {
  healthPlanId: number
  value: number
}

export interface CreateProcedureRequest {
  specialtyId: number
  tissCode: string
  name: string
  value: number
  healthPlanPrices?: HealthPlanPriceInput[]
}

export interface UpdateProcedureRequest {
  specialtyId?: number
  tissCode?: string
  name?: string
  value?: number
  healthPlanPrices?: HealthPlanPriceInput[]
}

export interface ListarProcedimentosParams {
  specialtyId?: number
  healthPlanId?: number
}
