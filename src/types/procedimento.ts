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
  tissCode: string
  value: string | number
  healthPlan?: ProcedureHealthPlanRef
}

export interface Procedure {
  id: number
  specialtyId: number
  name: string
  value: string | number
  specialty?: ProcedureSpecialtyRef
  healthPlanPrices: ProcedureHealthPlanPrice[]
}

export interface HealthPlanPriceInput {
  healthPlanId: number
  tissCode: string
  value: number
}

export interface CreateProcedureRequest {
  specialtyId: number
  name: string
  value: number
  healthPlanPrices?: HealthPlanPriceInput[]
}

export interface UpdateProcedureRequest {
  specialtyId?: number
  name?: string
  value?: number
  healthPlanPrices?: HealthPlanPriceInput[]
}

export interface ListarProcedimentosParams {
  specialtyId?: number
  healthPlanId?: number
}

export function precoDoPlano(
  procedure: Pick<Procedure, 'healthPlanPrices'> | undefined,
  healthPlanId: number,
): ProcedureHealthPlanPrice | undefined {
  return procedure?.healthPlanPrices?.find((item) => item.healthPlanId === healthPlanId)
}

export function tissCodeDoPlano(
  procedure: Pick<Procedure, 'healthPlanPrices'> | undefined,
  healthPlanId: number,
): string | undefined {
  const tiss = precoDoPlano(procedure, healthPlanId)?.tissCode?.trim()
  return tiss || undefined
}

export function valorDoPlano(
  procedure: Pick<Procedure, 'healthPlanPrices'> | undefined,
  healthPlanId: number,
): number | undefined {
  const raw = precoDoPlano(procedure, healthPlanId)?.value
  if (raw == null) return undefined
  const n = typeof raw === 'number' ? raw : Number(raw)
  return Number.isFinite(n) ? n : undefined
}
