import type { UfBrasil } from '../utils/ufBrasil'
import type { ScheduleInterval } from './bloqueioHorario'

export const COUNCIL_TYPES = [
  'CRESS',
  'COREN',
  'CRF',
  'CREFONO',
  'CREFITO',
  'CRM',
  'CRN',
  'CRO',
  'CRP',
  'OTHER',
  'CRBIO',
  'CRBM',
  'CREF',
  'CRMV',
  'CRTR',
] as const

export type CouncilType = (typeof COUNCIL_TYPES)[number]

export const COUNCIL_LABELS: Record<CouncilType, string> = {
  CRESS: 'CRESS — Conselho Regional de Serviço Social',
  COREN: 'COREN — Conselho Regional de Enfermagem',
  CRF: 'CRF — Conselho Regional de Farmácia',
  CREFONO: 'CREFONO — Conselho Regional de Fonoaudiologia',
  CREFITO: 'CREFITO — Conselho Regional de Fisioterapia e Terapia Ocupacional',
  CRM: 'CRM — Conselho Regional de Medicina',
  CRN: 'CRN — Conselho Regional de Nutrição',
  CRO: 'CRO — Conselho Regional de Odontologia',
  CRP: 'CRP — Conselho Regional de Psicologia',
  OTHER: 'Outros — Outros Conselhos',
  CRBIO: 'CRBio — Conselho Regional de Biologia',
  CRBM: 'CRBM — Conselho Regional de Biomedicina',
  CREF: 'CREF — Conselho Regional de Educação Física',
  CRMV: 'CRMV — Conselho Regional de Medicina Veterinária',
  CRTR: 'CRTR — Conselho Regional de Técnicos em Radiologia',
}

export function isCouncilType(value: string): value is CouncilType {
  return (COUNCIL_TYPES as readonly string[]).includes(value)
}

export interface HealthProfessionalSpecialtyRef {
  id: number
  name: string
  cbosCode?: string | null
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

export interface ScheduleRuleWindowInput extends ScheduleInterval {
  weekday: number
}

export interface ScheduleRuleInput {
  procedureId: number
  maxConcurrentAppointments: number
  durationMinutes: number
  slotIntervalMinutes: number
  allowOverbooking: boolean
  notes?: string | null
  windows: ScheduleRuleWindowInput[]
  procedure?: { id: number; name: string }
}

export interface HealthProfessional {
  id: number
  name: string
  councilType: CouncilType
  councilNumber: string
  councilUf: UfBrasil | null
  cpf: string
  phone: string | null
  email: string | null
  isActive: boolean
  specialties: HealthProfessionalSpecialtyLink[]
  weeklyBlocks: WeeklyBlockInput[]
  scheduleRules: ScheduleRuleInput[]
}

export interface CreateHealthProfessionalRequest {
  name: string
  specialties: HealthProfessionalSpecialtyInput[]
  councilType: CouncilType
  councilNumber: string
  councilUf?: UfBrasil
  cpf: string
  phone?: string
  email?: string
  isActive?: boolean
  weeklyBlocks?: WeeklyBlockInput[]
  scheduleRules?: ScheduleRuleInput[]
}

export interface UpdateHealthProfessionalRequest {
  name?: string
  specialties?: HealthProfessionalSpecialtyInput[]
  councilType?: CouncilType
  councilNumber?: string
  councilUf?: UfBrasil | null
  cpf?: string
  phone?: string | null
  email?: string | null
  isActive?: boolean
  weeklyBlocks?: WeeklyBlockInput[]
  scheduleRules?: ScheduleRuleInput[]
}
