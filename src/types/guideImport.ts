import type { InsuranceGuideStatus } from './guia'
import type { Patient } from './paciente'
import type { HealthPlan } from './planoSaude'
import type { Procedure } from './procedimento'
import type { HealthProfessional } from './profissional'
import type { TissGuideType } from './tiss'

export type ProfessionalSource = 'executante' | 'solicitante'

export interface ExtractedHealthPlan {
  name: string | null
  registroAns: string | null
}

export interface ExtractedPatient {
  name: string | null
  cardNumber: string | null
  cardExpirationDate: string | null
}

export interface ExtractedProfessional {
  name: string | null
  councilType: string | null
  councilNumber: string | null
  councilUf: string | null
  cbosCode: string | null
  source: ProfessionalSource | null
}

export interface ExtractedProcedure {
  tissCode: string | null
  description: string | null
  requestedQuantity: number | null
  authorizedQuantity: number | null
}

export interface ExtractedGuideMeta {
  operatorGuideNumber: string | null
  providerGuideNumber: string | null
  authorizationDate: string | null
  passwordExpirationDate: string | null
  attendanceDate: string | null
}

export interface ExtractedGuide {
  tissGuideType: TissGuideType | null
  healthPlan: ExtractedHealthPlan
  patient: ExtractedPatient
  professional: ExtractedProfessional
  procedures: ExtractedProcedure[]
  guide: ExtractedGuideMeta
}

export interface ExistingGuideRef {
  id: number
  guideNumber: string | null
}

export interface GuideImportProcedureMatch {
  extracted: ExtractedProcedure
  match: Procedure | null
}

export interface GuideImportMissing {
  healthPlan: boolean
  healthProfessional: boolean
  procedures: string[]
}

export interface GuideImportAnalysis {
  extracted: ExtractedGuide
  healthPlan: HealthPlan | null
  healthProfessional: HealthProfessional | null
  procedures: GuideImportProcedureMatch[]
  patient: Patient | null
  existingGuide: ExistingGuideRef | null
  missing: GuideImportMissing
  warnings: string[]
  canAdvance: boolean
}

export interface CommitGuideImportRequest {
  healthPlanId: number
  healthProfessionalId: number
  procedures: Array<{ procedureId: number; authorizedQuantity: number }>
  patient:
    | {
        mode: 'existing'
        patientId: number
        cardNumber?: string
        cardExpirationDate?: string
      }
    | {
        mode: 'create'
        name: string
        phone: string
        email?: string
        birthDate?: string
        cpf?: string
        cardNumber: string
        cardExpirationDate: string
      }
  guideNumber?: string
  authorizationDate?: string
  expirationDate?: string
  status?: InsuranceGuideStatus
}
