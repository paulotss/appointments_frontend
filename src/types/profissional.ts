export type CouncilType = 'CRM' | 'CRO' | 'CRP' | 'COREN' | 'OTHER'

export const COUNCIL_TYPES: CouncilType[] = ['CRM', 'CRO', 'CRP', 'COREN', 'OTHER']

export interface HealthProfessionalSpecialtyRef {
  id: number
  name: string
}

export interface HealthProfessionalSpecialtyLink {
  specialtyId: number
  specialty?: HealthProfessionalSpecialtyRef
}

export interface HealthProfessionalSpecialtyInput {
  specialtyId: number
}

export interface HealthProfessional {
  id: number
  name: string
  councilType: CouncilType
  councilNumber: string
  cpf: string
  phone: string | null
  email: string | null
  isActive: boolean
  specialties: HealthProfessionalSpecialtyLink[]
}

export interface CreateHealthProfessionalRequest {
  name: string
  specialties: HealthProfessionalSpecialtyInput[]
  councilType: CouncilType
  councilNumber: string
  cpf: string
  phone?: string
  email?: string
  isActive?: boolean
}

export interface UpdateHealthProfessionalRequest {
  name?: string
  specialties?: HealthProfessionalSpecialtyInput[]
  councilType?: CouncilType
  councilNumber?: string
  cpf?: string
  phone?: string | null
  email?: string | null
  isActive?: boolean
}
