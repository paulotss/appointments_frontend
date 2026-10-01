import type { InsuranceGuide, InsuranceGuideProcedureRef, InsuranceGuideRef } from './guia'

export const CLINICAL_APPOINTMENT_STATUSES = [
  'marked',
  'confirmed',
  'waiting',
  'attended',
  'finished',
  'absent',
] as const

export type ClinicalAppointmentStatus = (typeof CLINICAL_APPOINTMENT_STATUSES)[number]

export const CLINICAL_APPOINTMENT_STATUS_LABELS: Record<ClinicalAppointmentStatus, string> = {
  marked: 'Marcado',
  confirmed: 'Confirmado',
  waiting: 'Em espera',
  attended: 'Atendido',
  finished: 'Finalizado',
  absent: 'Falta',
}

export const CLINICAL_APPOINTMENT_TYPES = ['private', 'health_plan', 'mixed'] as const

export type ClinicalAppointmentType = (typeof CLINICAL_APPOINTMENT_TYPES)[number]

export const CLINICAL_APPOINTMENT_TYPE_LABELS: Record<ClinicalAppointmentType, string> = {
  private: 'Particular',
  health_plan: 'Plano de saúde',
  mixed: 'Misto',
}

export const CLINICAL_APPOINTMENT_STATUS_CORES: Record<ClinicalAppointmentStatus, string> = {
  marked: '#90a4ae',
  confirmed: '#2e7d32',
  waiting: '#ed6c02',
  attended: '#0277bd',
  finished: '#616161',
  absent: '#c62828',
}

export const CLINICAL_APPOINTMENT_TYPE_CORES: Record<ClinicalAppointmentType, string> = {
  private: '#1f8f66',
  health_plan: '#1565c0',
  mixed: '#6a1b9a',
}

export const CLINICAL_APPOINTMENT_PROCEDURE_ORIGINS = [
  'private',
  'package',
  'health_plan',
  'benefit',
] as const
export type ClinicalAppointmentProcedureOrigin =
  (typeof CLINICAL_APPOINTMENT_PROCEDURE_ORIGINS)[number]

export interface ClinicalAppointmentProcedure {
  id: number
  clinicalAppointmentId: number
  procedureId: number
  origin: ClinicalAppointmentProcedureOrigin
  patientPackageItemId?: number | null
  insuranceGuideId?: number | null
  benefitEntitlementId?: number | null
  procedure?: InsuranceGuideProcedureRef
}

export interface ClinicalAppointmentGuideLink {
  id: number
  clinicalAppointmentId: number
  insuranceGuideId: number
  insuranceGuide?: InsuranceGuide
}

export interface ClinicalAppointment {
  id: number
  patientId: number
  healthProfessionalId: number
  scheduledAt: string
  endsAt: string
  status: ClinicalAppointmentStatus
  type: ClinicalAppointmentType
  notes: string | null
  patient?: InsuranceGuideRef
  healthProfessional?: InsuranceGuideRef
  insuranceGuides: ClinicalAppointmentGuideLink[]
  procedures: ClinicalAppointmentProcedure[]
}

export interface BenefitEntitlementUse {
  entitlementId: number
  procedureId: number
}

export interface CreateClinicalAppointmentRequest {
  patientId: number
  healthProfessionalId: number
  scheduledAt: string
  endsAt: string
  type?: ClinicalAppointmentType
  status?: ClinicalAppointmentStatus
  notes?: string
  insuranceGuideIds?: number[]
  procedureIds?: number[]
  patientPackageItemIds?: number[]
  benefitUses?: BenefitEntitlementUse[]
}

export interface UpdateClinicalAppointmentRequest {
  patientId?: number
  healthProfessionalId?: number
  scheduledAt?: string
  endsAt?: string
  type?: ClinicalAppointmentType
  status?: ClinicalAppointmentStatus
  notes?: string | null
  insuranceGuideIds?: number[]
  procedureIds?: number[]
  patientPackageItemIds?: number[]
  benefitUses?: BenefitEntitlementUse[]
}

export interface ListarAgendamentosClinicosParams {
  patientId?: number
  healthProfessionalId?: number
  status?: ClinicalAppointmentStatus
  type?: ClinicalAppointmentType
  insuranceGuideId?: number
  from?: string
  to?: string
}

export function guiasDoAgendamento(item: ClinicalAppointment): InsuranceGuide[] {
  return (item.insuranceGuides ?? [])
    .map((link) => link.insuranceGuide)
    .filter((guia): guia is InsuranceGuide => Boolean(guia))
}

export function idsGuiasDoAgendamento(item: ClinicalAppointment): number[] {
  return (item.insuranceGuides ?? []).map((link) => link.insuranceGuideId)
}

export function idsAvulsosDoAgendamento(item: ClinicalAppointment): number[] {
  return (item.procedures ?? [])
    .filter((linha) => (linha.origin ?? 'private') === 'private')
    .map((linha) => linha.procedureId)
}

export function idsItensPacoteDoAgendamento(item: ClinicalAppointment): number[] {
  return (item.procedures ?? [])
    .filter((linha) => linha.origin === 'package' && linha.patientPackageItemId != null)
    .map((linha) => linha.patientPackageItemId as number)
}

export function usosCartaoDoAgendamento(item: ClinicalAppointment): BenefitEntitlementUse[] {
  return (item.procedures ?? [])
    .filter((linha) => linha.origin === 'benefit' && linha.benefitEntitlementId != null)
    .map((linha) => ({
      entitlementId: linha.benefitEntitlementId as number,
      procedureId: linha.procedureId,
    }))
}

export function temAvulsoParaCobrar(item: ClinicalAppointment): boolean {
  return (item.procedures ?? []).some((linha) => (linha.origin ?? 'private') === 'private')
}
