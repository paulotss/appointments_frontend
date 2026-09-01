export interface PatientPlanRef {
  id: number
  name: string
}

export interface InsuranceCard {
  id: number
  patientId: number
  healthPlanId: number
  cardNumber: string
  expirationDate: string
  healthPlan?: PatientPlanRef
}

export interface InsuranceCardInput {
  id?: number
  healthPlanId: number
  cardNumber: string
  expirationDate: string
}

export interface Patient {
  id: number
  name: string
  phone: string
  email: string | null
  birthDate: string | null
  cpf: string | null
  insuranceCards: InsuranceCard[]
}

export interface CreatePatientRequest {
  name: string
  phone: string
  email?: string
  birthDate?: string
  cpf?: string
}

export interface UpdatePatientRequest {
  name?: string
  phone?: string
  email?: string | null
  birthDate?: string | null
  cpf?: string | null
}
