export interface ClinicalChart {
  id: number | null
  patientId: number
  allergies: string | null
  chronicConditions: string | null
  currentMedications: string | null
  personalHistory: string | null
  familyHistory: string | null
  habits: string | null
  updatedAt: string | null
}

export interface ClinicalChartInput {
  allergies: string
  chronicConditions: string
  currentMedications: string
  personalHistory: string
  familyHistory: string
  habits: string
}

export interface ClinicalEvolutionProfessional {
  id: number
  name: string
  councilType: string
  councilNumber: string
  councilUf: string | null
}

export interface ClinicalEvolutionAppointmentRef {
  id: number
  scheduledAt: string
}

export interface ClinicalEvolution {
  id: number
  patientId: number
  healthProfessionalId: number
  clinicalAppointmentId: number | null
  occurredAt: string
  subjective: string
  objective: string
  assessment: string
  plan: string
  createdAt: string
  updatedAt: string
  healthProfessional: ClinicalEvolutionProfessional
  clinicalAppointment: ClinicalEvolutionAppointmentRef | null
}

export interface ClinicalEvolutionInput {
  occurredAt: string
  clinicalAppointmentId: number | null
  subjective: string
  objective: string
  assessment: string
  plan: string
}
