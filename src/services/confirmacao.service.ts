import { apiClient } from './apiClient'
import type {
  CampaignDetail,
  CampaignItem,
  CampaignSourceKey,
  CampaignSummary,
  ContactAssociation,
  ContactAuditEvent,
  ContactAuthorization,
  ContactOrigin,
  ContactSubjectRole,
  ContactVerification,
  ContactVerificationProcedure,
  PatientSearchResult,
} from '../types/confirmacao'

export async function listarCampanhas(): Promise<CampaignSummary[]> {
  const response = await apiClient.get<CampaignSummary[]>('/confirmation-campaigns')
  return response.data
}

export interface CampaignSimulation {
  mode: 'simulation'
  dispatchEnabled: false
  runId: string
  status: 'RUNNING' | 'COMPLETED' | 'INVALIDATED'
  currentApproval: boolean
  leaseExpired: boolean
  createdAt: string
  completedAt: string | null
  report: null | {
    blocked: string | null
    items: Array<{ itemId: number; result: string }>
  }
}

export async function listarSimulacoes(id: number): Promise<CampaignSimulation[]> {
  const response = await apiClient.get<CampaignSimulation[]>(`/confirmation-campaigns/${id}/simulations`)
  return response.data
}

export async function obterCampanha(id: number): Promise<CampaignDetail> {
  const response = await apiClient.get<CampaignDetail>(`/confirmation-campaigns/${id}`)
  return response.data
}

export async function criarCampanha(payload: {
  campaignDate: string
  source: CampaignSourceKey
  items?: Array<{
    appointmentRef: string
    patientRef?: string | null
    recipientRef?: string | null
    informedPhoneRef?: string | null
    recipientState: CampaignItem['recipientState']
    reasonCode?: string | null
  }>
}): Promise<CampaignDetail> {
  const response = await apiClient.post<CampaignDetail>('/confirmation-campaigns', payload)
  return response.data
}

export async function substituirItensCampanha(
  id: number,
  items: Array<Omit<CampaignItem, 'id'>>,
): Promise<CampaignDetail> {
  const response = await apiClient.put<CampaignDetail>(`/confirmation-campaigns/${id}/items`, { items })
  return response.data
}

export async function colocarCampanhaEmRevisao(id: number): Promise<CampaignDetail> {
  const response = await apiClient.post<CampaignDetail>(`/confirmation-campaigns/${id}/review`)
  return response.data
}

export async function aprovarCampanha(id: number): Promise<CampaignDetail> {
  const response = await apiClient.post<CampaignDetail>(`/confirmation-campaigns/${id}/approve`)
  return response.data
}

export async function reabrirCampanha(id: number): Promise<CampaignDetail> {
  const response = await apiClient.post<CampaignDetail>(`/confirmation-campaigns/${id}/reopen`)
  return response.data
}

export async function pesquisarPacientes(name: string): Promise<PatientSearchResult> {
  const response = await apiClient.post<PatientSearchResult>('/contact-registry/patient-search', { name })
  return response.data
}

export async function listarVerificacoes(patientRef: string): Promise<ContactVerification[]> {
  const response = await apiClient.get<ContactVerification[]>('/contact-registry/verifications', {
    params: { patientRef },
  })
  return response.data
}

export async function informarContato(payload: {
  patientRef: string
  recipientRef: string
  informedPhoneRef: string
  role: ContactSubjectRole
  origin: ContactOrigin
  evidenceRef?: string
}): Promise<ContactVerification> {
  const response = await apiClient.post<ContactVerification>('/contact-registry/verifications', payload)
  return response.data
}

export async function verificarContato(
  id: string,
  payload: { procedure: ContactVerificationProcedure; legalGuardianVerified: boolean },
): Promise<ContactVerification> {
  const response = await apiClient.post<ContactVerification>(
    `/contact-registry/verifications/${id}/verify`,
    payload,
  )
  return response.data
}

export async function revogarVerificacao(id: string): Promise<ContactVerification> {
  const response = await apiClient.post<ContactVerification>(`/contact-registry/verifications/${id}/revoke`)
  return response.data
}

export async function listarAutorizacoes(patientRef: string): Promise<ContactAuthorization[]> {
  const response = await apiClient.get<ContactAuthorization[]>('/contact-registry/authorizations', {
    params: { patientRef },
  })
  return response.data
}

export async function registrarAutorizacao(payload: {
  patientRef: string
  recipientRef: string
  purpose: 'appointment_contact'
  channel: 'whatsapp'
  legalBasis: string
  evidenceRef?: string
  validFrom: string
  expiresAt: string
}): Promise<ContactAuthorization> {
  const response = await apiClient.post<ContactAuthorization>('/contact-registry/authorizations', payload)
  return response.data
}

export async function revogarAutorizacao(id: string): Promise<ContactAuthorization> {
  const response = await apiClient.post<ContactAuthorization>(`/contact-registry/authorizations/${id}/revoke`)
  return response.data
}

export async function listarAssociacoes(patientRef: string): Promise<ContactAssociation[]> {
  const response = await apiClient.get<ContactAssociation[]>('/contact-registry/associations', {
    params: { patientRef },
  })
  return response.data
}

export async function associarPaciente(payload: {
  patientRef: string
  higiaPatientId?: number
}): Promise<ContactAssociation> {
  const response = await apiClient.post<ContactAssociation>('/contact-registry/associations', payload)
  return response.data
}

export async function listarAuditoriaContato(patientRef: string): Promise<ContactAuditEvent[]> {
  const response = await apiClient.get<ContactAuditEvent[]>('/contact-registry/audit', {
    params: { patientRef },
  })
  return response.data
}
