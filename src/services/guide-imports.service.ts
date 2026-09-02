import type {
  CommitGuideImportRequest,
  ExtractedGuide,
  ExtractedProcedure,
  GuideImportAnalysis,
  ProfessionalSource,
} from '../types/guideImport'
import type { InsuranceGuide } from '../types/guia'
import type { Patient } from '../types/paciente'
import type { HealthPlan } from '../types/planoSaude'
import type { Procedure, ProcedureHealthPlanPrice } from '../types/procedimento'
import type { CouncilType, HealthProfessional, HealthProfessionalSpecialtyLink } from '../types/profissional'
import { DEFAULT_TISS_VERSION, TISS_GUIDE_TYPES, TISS_VERSIONS, type TissGuideType } from '../types/tiss'
import type { UfBrasil } from '../utils/ufBrasil'
import { isoDatePrefix } from '../utils/dataISO'
import { apiClient } from './apiClient'
import { mapBackendGuide } from './insurance-guides.service'
import { mapBackendInsuranceCard } from './insurance-cards.service'

interface BackendPlan {
  id: number
  name: string
  submissionDeadlineDays: number
  registroAns?: string | null
  providerCode?: string | null
  tissVersion?: string
}

interface BackendPatient {
  id: number
  name: string
  phone: string
  email?: string | null
  birthDate?: string | null
  cpf?: string | null
  insuranceCards?: Array<{
    id: number
    patientId: number
    healthPlanId: number
    cardNumber: string
    expirationDate?: string
    healthPlan?: { id: number; name: string }
  }>
}

interface BackendProfessional {
  id: number
  name: string
  councilType: CouncilType
  councilNumber: string
  councilUf?: string | null
  cbosCode?: string | null
  cpf: string
  phone?: string | null
  email?: string | null
  isActive: boolean
  specialties?: Array<{ specialtyId: number; specialty?: { id: number; name: string } }>
}

interface BackendProcedure {
  id: number
  specialtyId: number
  name: string
  value: string | number
  tissGuideType?: TissGuideType
  specialty?: { id: number; name: string }
  healthPlanPrices?: Array<{
    id: number
    healthPlanId: number
    procedureId: number
    tissCode: string
    value: string | number
    healthPlan?: { id: number; name: string; submissionDeadlineDays: number }
  }>
}

interface BackendAnalysis {
  extracted: ExtractedGuide
  healthPlan?: BackendPlan | null
  healthProfessional?: BackendProfessional | null
  procedures?: Array<{ extracted: ExtractedProcedure; match?: BackendProcedure | null }>
  patient?: BackendPatient | null
  existingGuide?: { id: number; guideNumber?: string | null } | null
  missing?: { healthPlan?: boolean; healthProfessional?: boolean; procedures?: string[] }
  warnings?: string[]
  canAdvance?: boolean
}

function mapPlan(item: BackendPlan): HealthPlan {
  const version = TISS_VERSIONS.find((value) => value === item.tissVersion)
  return {
    id: item.id,
    name: item.name,
    submissionDeadlineDays: item.submissionDeadlineDays,
    registroAns: item.registroAns ?? null,
    providerCode: item.providerCode ?? null,
    tissVersion: version ?? DEFAULT_TISS_VERSION,
  }
}

function mapPatient(item: BackendPatient): Patient {
  return {
    id: item.id,
    name: item.name,
    phone: item.phone,
    email: item.email ?? null,
    birthDate: isoDatePrefix(item.birthDate) || null,
    cpf: item.cpf ?? null,
    insuranceCards: (item.insuranceCards ?? []).map(mapBackendInsuranceCard),
  }
}

function mapSpecialtyLink(item: {
  specialtyId: number
  specialty?: { id: number; name: string }
}): HealthProfessionalSpecialtyLink {
  return { specialtyId: item.specialtyId, specialty: item.specialty }
}

function mapProfessional(item: BackendProfessional): HealthProfessional {
  return {
    id: item.id,
    name: item.name,
    councilType: item.councilType,
    councilNumber: item.councilNumber,
    councilUf: (item.councilUf as UfBrasil | null) ?? null,
    cbosCode: item.cbosCode ?? null,
    cpf: item.cpf,
    phone: item.phone ?? null,
    email: item.email ?? null,
    isActive: item.isActive,
    specialties: (item.specialties ?? []).map(mapSpecialtyLink),
  }
}

function mapPrice(item: NonNullable<BackendProcedure['healthPlanPrices']>[number]): ProcedureHealthPlanPrice {
  return {
    id: item.id,
    healthPlanId: item.healthPlanId,
    procedureId: item.procedureId,
    tissCode: item.tissCode,
    value: item.value,
    healthPlan: item.healthPlan,
  }
}

function mapProcedure(item: BackendProcedure): Procedure {
  return {
    id: item.id,
    specialtyId: item.specialtyId,
    name: item.name,
    value: item.value,
    tissGuideType: item.tissGuideType === 'consulta' ? 'consulta' : 'sp_sadt',
    specialty: item.specialty,
    healthPlanPrices: (item.healthPlanPrices ?? []).map(mapPrice),
  }
}

function mapExtracted(item: ExtractedGuide): ExtractedGuide {
  const type = TISS_GUIDE_TYPES.find((value) => value === item.tissGuideType) ?? null
  const source = item.professional?.source
  const professionalSource: ProfessionalSource | null =
    source === 'executante' || source === 'solicitante' ? source : null
  return {
    tissGuideType: type,
    healthPlan: {
      name: item.healthPlan?.name ?? null,
      registroAns: item.healthPlan?.registroAns ?? null,
    },
    patient: {
      name: item.patient?.name ?? null,
      cardNumber: item.patient?.cardNumber ?? null,
      cardExpirationDate: isoDatePrefix(item.patient?.cardExpirationDate) || null,
    },
    professional: {
      name: item.professional?.name ?? null,
      councilType: item.professional?.councilType ?? null,
      councilNumber: item.professional?.councilNumber ?? null,
      councilUf: item.professional?.councilUf ?? null,
      cbosCode: item.professional?.cbosCode ?? null,
      source: professionalSource,
    },
    procedures: (item.procedures ?? []).map((row) => ({
      tissCode: row.tissCode ?? null,
      description: row.description ?? null,
      requestedQuantity: row.requestedQuantity ?? null,
      authorizedQuantity: row.authorizedQuantity ?? null,
    })),
    guide: {
      operatorGuideNumber: item.guide?.operatorGuideNumber ?? null,
      providerGuideNumber: item.guide?.providerGuideNumber ?? null,
      authorizationDate: isoDatePrefix(item.guide?.authorizationDate) || null,
      passwordExpirationDate: isoDatePrefix(item.guide?.passwordExpirationDate) || null,
      attendanceDate: isoDatePrefix(item.guide?.attendanceDate) || null,
    },
  }
}

function mapAnalysis(item: BackendAnalysis): GuideImportAnalysis {
  const extracted = mapExtracted(item.extracted)
  return {
    extracted,
    healthPlan: item.healthPlan ? mapPlan(item.healthPlan) : null,
    healthProfessional: item.healthProfessional ? mapProfessional(item.healthProfessional) : null,
    procedures: (item.procedures ?? []).map((row) => ({
      extracted: {
        tissCode: row.extracted?.tissCode ?? null,
        description: row.extracted?.description ?? null,
        requestedQuantity: row.extracted?.requestedQuantity ?? null,
        authorizedQuantity: row.extracted?.authorizedQuantity ?? null,
      },
      match: row.match ? mapProcedure(row.match) : null,
    })),
    patient: item.patient ? mapPatient(item.patient) : null,
    existingGuide: item.existingGuide
      ? { id: item.existingGuide.id, guideNumber: item.existingGuide.guideNumber ?? null }
      : null,
    missing: {
      healthPlan: Boolean(item.missing?.healthPlan),
      healthProfessional: Boolean(item.missing?.healthProfessional),
      procedures: item.missing?.procedures ?? [],
    },
    warnings: item.warnings ?? [],
    canAdvance: Boolean(item.canAdvance),
  }
}

export async function analisarGuia(file: File): Promise<GuideImportAnalysis> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await apiClient.post<BackendAnalysis>('/guide-imports/analyze', formData, {
    headers: { 'Content-Type': false },
  })
  return mapAnalysis(response.data)
}

export async function recruzarGuia(extracted: ExtractedGuide): Promise<GuideImportAnalysis> {
  const response = await apiClient.post<BackendAnalysis>('/guide-imports/match', { extracted })
  return mapAnalysis(response.data)
}

export async function confirmarImportacaoGuia(
  payload: CommitGuideImportRequest,
): Promise<InsuranceGuide> {
  const response = await apiClient.post('/guide-imports/commit', payload)
  return mapBackendGuide(response.data)
}
