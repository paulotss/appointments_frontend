export interface HealthPlan {
  id: number
  name: string
  submissionDeadlineDays: number
}

export interface CreateHealthPlanRequest {
  name: string
  submissionDeadlineDays: number
}

export interface UpdateHealthPlanRequest {
  name?: string
  submissionDeadlineDays?: number
}
