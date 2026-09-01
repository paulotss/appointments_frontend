import type { TissVersion } from './tiss'
import { DEFAULT_TISS_VERSION } from './tiss'

export interface HealthPlan {
  id: number
  name: string
  submissionDeadlineDays: number
  registroAns: string | null
  providerCode: string | null
  tissVersion: TissVersion
}

export interface CreateHealthPlanRequest {
  name: string
  submissionDeadlineDays: number
  registroAns?: string
  providerCode?: string
  tissVersion?: TissVersion
}

export interface UpdateHealthPlanRequest {
  name?: string
  submissionDeadlineDays?: number
  registroAns?: string | null
  providerCode?: string | null
  tissVersion?: TissVersion
}

export { DEFAULT_TISS_VERSION }
