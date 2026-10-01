import type { UfBrasil } from '../utils/ufBrasil'
import type { ScheduleInterval } from './bloqueioHorario'

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

export interface WeeklyBlockInput extends ScheduleInterval {
  weekday: number
}

export interface HealthProfessional {
  id: number
  name: string
  councilType: CouncilType
  councilNumber: string
  councilUf: UfBrasil | null
  cbosCode: string | null
  cpf: string
  phone: string | null
  email: string | null
  isActive: boolean
  specialties: HealthProfessionalSpecialtyLink[]
  weeklyBlocks: WeeklyBlockInput[]
}

export interface CreateHealthProfessionalRequest {
  name: string
  specialties: HealthProfessionalSpecialtyInput[]
  councilType: CouncilType
  councilNumber: string
  councilUf?: UfBrasil
  cbosCode?: string
  cpf: string
  phone?: string
  email?: string
  isActive?: boolean
  weeklyBlocks?: WeeklyBlockInput[]
}

export interface UpdateHealthProfessionalRequest {
  name?: string
  specialties?: HealthProfessionalSpecialtyInput[]
  councilType?: CouncilType
  councilNumber?: string
  councilUf?: UfBrasil | null
  cbosCode?: string | null
  cpf?: string
  phone?: string | null
  email?: string | null
  isActive?: boolean
  weeklyBlocks?: WeeklyBlockInput[]
}
