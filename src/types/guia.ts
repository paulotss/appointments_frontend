export interface InsuranceGuideRef {
  id: number
  name: string
}

export interface InsuranceGuidePlanRef extends InsuranceGuideRef {
  submissionDeadlineDays: number
}

export interface InsuranceGuide {
  id: number
  healthPlanId: number
  patientId: number
  specialtyId: number
  healthProfessionalId: number
  quantity: number
  expirationDate: string
  healthPlan?: InsuranceGuidePlanRef
  patient?: InsuranceGuideRef
  specialty?: InsuranceGuideRef
  healthProfessional?: InsuranceGuideRef
}

export interface CreateInsuranceGuideRequest {
  healthPlanId: number
  patientId: number
  specialtyId: number
  healthProfessionalId: number
  quantity: number
  expirationDate: string
}

export interface UpdateInsuranceGuideRequest {
  healthPlanId?: number
  patientId?: number
  specialtyId?: number
  healthProfessionalId?: number
  quantity?: number
  expirationDate?: string
}
