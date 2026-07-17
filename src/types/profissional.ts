export type CouncilType = 'CRM' | 'CRO' | 'CRP' | 'COREN' | 'OTHER'

export const COUNCIL_TYPES: CouncilType[] = ['CRM', 'CRO', 'CRP', 'COREN', 'OTHER']

export interface HealthProfessionalSpecialty {
  id: number
  name: string
}

export interface HealthProfessional {
  id: number
  name: string
  specialtyId: number
  councilType: CouncilType
  councilNumber: string
  cpf: string
  phone: string | null
  email: string | null
  isActive: boolean
  specialty?: HealthProfessionalSpecialty
}

export interface CreateHealthProfessionalRequest {
  name: string
  specialtyId: number
  councilType: CouncilType
  councilNumber: string
  cpf: string
  phone?: string
  email?: string
  isActive?: boolean
}

export interface UpdateHealthProfessionalRequest {
  name?: string
  specialtyId?: number
  councilType?: CouncilType
  councilNumber?: string
  cpf?: string
  phone?: string | null
  email?: string | null
  isActive?: boolean
}
