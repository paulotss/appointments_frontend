import type {
  ClinicalAppointment,
  ClinicalAppointmentGuideLink,
  ClinicalAppointmentProcedure,
  ClinicalAppointmentStatus,
  ClinicalAppointmentType,
  CreateClinicalAppointmentRequest,
  ListarAgendamentosClinicosParams,
  UpdateClinicalAppointmentRequest,
} from '../types/agendamentoClinico'
import { mapBackendGuide } from './insurance-guides.service'
import { apiClient } from './apiClient'

interface BackendRef {
  id: number
  name: string
}

interface BackendProcedureRef {
  id: number
  name: string
  tissCode: string
  value: string | number
  specialtyId: number
  specialty?: BackendRef
}

interface BackendAppointmentProcedure {
  id: number
  clinicalAppointmentId: number
  procedureId: number
  procedure?: BackendProcedureRef
}

interface BackendGuideLink {
  id: number
  clinicalAppointmentId: number
  insuranceGuideId: number
  insuranceGuide?: Parameters<typeof mapBackendGuide>[0]
}

interface BackendClinicalAppointment {
  id: number
  patientId: number
  healthProfessionalId: number
  scheduledAt: string
  status: ClinicalAppointmentStatus
  type: ClinicalAppointmentType
  patient?: BackendRef
  healthProfessional?: BackendRef
  insuranceGuides?: BackendGuideLink[]
  procedures?: BackendAppointmentProcedure[]
}

function mapAppointmentProcedure(item: BackendAppointmentProcedure): ClinicalAppointmentProcedure {
  return {
    id: item.id,
    clinicalAppointmentId: item.clinicalAppointmentId,
    procedureId: item.procedureId,
    procedure: item.procedure,
  }
}

function mapGuideLink(item: BackendGuideLink): ClinicalAppointmentGuideLink {
  return {
    id: item.id,
    clinicalAppointmentId: item.clinicalAppointmentId,
    insuranceGuideId: item.insuranceGuideId,
    insuranceGuide: item.insuranceGuide ? mapBackendGuide(item.insuranceGuide) : undefined,
  }
}

function mapBackendAppointment(item: BackendClinicalAppointment): ClinicalAppointment {
  return {
    id: item.id,
    patientId: item.patientId,
    healthProfessionalId: item.healthProfessionalId,
    scheduledAt: item.scheduledAt,
    status: item.status,
    type: item.type,
    patient: item.patient,
    healthProfessional: item.healthProfessional,
    insuranceGuides: (item.insuranceGuides ?? []).map(mapGuideLink),
    procedures: (item.procedures ?? []).map(mapAppointmentProcedure),
  }
}

export async function listarAgendamentosClinicos(
  params?: ListarAgendamentosClinicosParams,
): Promise<ClinicalAppointment[]> {
  const response = await apiClient.get<BackendClinicalAppointment[]>('/clinical-appointments', {
    params,
  })
  return response.data.map(mapBackendAppointment)
}

export async function buscarAgendamentoClinico(id: number): Promise<ClinicalAppointment> {
  const response = await apiClient.get<BackendClinicalAppointment>(`/clinical-appointments/${id}`)
  return mapBackendAppointment(response.data)
}

export async function criarAgendamentoClinico(
  payload: CreateClinicalAppointmentRequest,
): Promise<ClinicalAppointment> {
  const response = await apiClient.post<BackendClinicalAppointment>(
    '/clinical-appointments',
    payload,
  )
  return mapBackendAppointment(response.data)
}

export async function atualizarAgendamentoClinico(
  id: number,
  payload: UpdateClinicalAppointmentRequest,
): Promise<ClinicalAppointment> {
  const response = await apiClient.patch<BackendClinicalAppointment>(
    `/clinical-appointments/${id}`,
    payload,
  )
  return mapBackendAppointment(response.data)
}

export async function excluirAgendamentoClinico(id: number): Promise<void> {
  await apiClient.delete(`/clinical-appointments/${id}`)
}
