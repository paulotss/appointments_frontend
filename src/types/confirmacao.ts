export type CampaignSourceKey = 'SAUDEVIANET' | 'HIGIA'
export type CampaignAdminStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED'
export type CampaignConsultationState = 'NOT_CONNECTED' | 'READY' | 'EMPTY' | 'PARTIAL' | 'FAILED'
export type CampaignRecipientState = 'ELIGIBLE' | 'PENDING' | 'UNAVAILABLE'
export type ContactOrigin = 'IN_PERSON' | 'PHONE' | 'WHATSAPP'
export type ContactSubjectRole = 'PATIENT' | 'GUARDIAN'
export type ContactVerificationStatus = 'INFORMED' | 'VERIFIED'
export type ContactVerificationProcedure =
  | 'DOCUMENT_PRESENTED'
  | 'CALLBACK'
  | 'IN_PERSON_CONFIRMATION'
  | 'GUARDIAN_PRESENT'
  | 'RECORDED_PROCEDURE'

export interface StaffActor {
  id: number
  name: string
}

export interface CampaignSummary {
  id: number
  campaignDate: string
  source: CampaignSourceKey
  sourceLabel: string
  status: CampaignAdminStatus
  appointmentsAnalyzed: number
  eligibleRecipients: number
  pendingVerifications: number
  unavailableRecipients: number
  consultationState: CampaignConsultationState
  consultationReason: string | null
  approvedAt: string | null
  createdAt: string
  createdBy: StaffActor
  approvedBy: StaffActor | null
  dispatchEnabled: false
}

export interface CampaignItem {
  id: number
  appointmentRef: string
  patientRef: string | null
  recipientRef: string | null
  informedPhoneRef: string | null
  professionalRef: string | null
  appointmentTime: string | null
  agendaRef: string | null
  sourceResolution: string | null
  isMinor: boolean | null
  recipientState: CampaignRecipientState
  reasonCode: string | null
}

export interface CampaignEvent {
  id: number
  action: string
  fromStatus: CampaignAdminStatus | null
  toStatus: CampaignAdminStatus | null
  createdAt: string
  actor: StaffActor
}

export interface CampaignDetail extends CampaignSummary {
  items: CampaignItem[]
  events: CampaignEvent[]
}

export interface ContactVerification {
  id: string
  patientRef: string
  recipientRef: string
  informedPhoneRef: string
  verifiedPhoneRef: string | null
  role: ContactSubjectRole
  legalGuardianVerified: boolean
  origin: ContactOrigin
  procedure: ContactVerificationProcedure | null
  status: ContactVerificationStatus
  evidenceRef: string | null
  ownershipProven: false
  recordedAt: string
  verifiedAt: string | null
  revokedAt: string | null
  recordedBy: StaffActor
  verifiedBy: StaffActor | null
  revokedBy: StaffActor | null
}

export interface ContactAuthorization {
  id: string
  patientRef: string
  recipientRef: string
  purpose: string
  channel: string
  legalBasis: string
  evidenceRef: string | null
  validFrom: string
  expiresAt: string
  recordedAt: string
  revokedAt: string | null
  recordedBy: StaffActor
  revokedBy: StaffActor | null
  grantsOwnership: false
}

export interface ContactAssociation {
  id: string
  patientRef: string
  higiaPatientId: number | null
  associatedAt: string
  associatedBy: StaffActor
}

export interface ContactAuditEvent {
  id: number
  action: string
  subjectType: string
  subjectId: string
  patientRef: string | null
  createdAt: string
  actor: StaffActor
}

export const CAMPAIGN_STATUS_LABELS: Record<CampaignAdminStatus, string> = {
  DRAFT: 'Rascunho',
  IN_REVIEW: 'Em revisão',
  APPROVED: 'Aprovada',
}

export const RECIPIENT_STATE_LABELS: Record<CampaignRecipientState, string> = {
  ELIGIBLE: 'Apto',
  PENDING: 'Pendente',
  UNAVAILABLE: 'Indisponível',
}

export const CONSULTATION_LABELS: Record<CampaignConsultationState, string> = {
  NOT_CONNECTED: 'Origem ainda não consultada',
  READY: 'Agenda consultada',
  EMPTY: 'Agenda vazia neste dia',
  PARTIAL: 'Consulta parcial',
  FAILED: 'Falha na consulta da agenda',
}

export const REASON_LABELS: Record<string, string> = {
  verification_missing: 'Verificação do contato ausente',
  authorization_missing: 'Autorização de contato ausente',
  authorization_revoked: 'Autorização revogada',
  ownership_revoked: 'Verificação revogada',
  contact_ready: 'Verificações exigidas concluídas',
  phone_missing: 'Número utilizável ausente',
  phone_invalid: 'Número informado inválido',
  not_mobile: 'Contato não é celular',
  ambiguous: 'Contato ambíguo',
  age_unknown: 'Idade não confirmada',
  minor_guardian_missing: 'Responsável legal não verificado',
  registry_unavailable: 'Registro de contatos indisponível',
  revalidation_mismatch: 'Revalidação não confirmou o agendamento',
  query_failed: 'Falha ao consultar a agenda',
  source_not_configured: 'Integração da agenda não configurada',
  unexpected_response: 'Resposta da agenda incompatível',
  reclassification_unavailable: 'Não foi possível atualizar a pendência',
  partial_consultation: 'Parte das agendas não pôde ser consultada',
}

export const CONTACT_ORIGIN_LABELS: Record<ContactOrigin, string> = {
  IN_PERSON: 'Presencial',
  PHONE: 'Telefone',
  WHATSAPP: 'WhatsApp',
}

export const CONTACT_ROLE_LABELS: Record<ContactSubjectRole, string> = {
  PATIENT: 'Paciente',
  GUARDIAN: 'Responsável legal',
}

export const VERIFICATION_STATUS_LABELS: Record<ContactVerificationStatus, string> = {
  INFORMED: 'Informado',
  VERIFIED: 'Procedimento registrado',
}

export const PROCEDURE_LABELS: Record<ContactVerificationProcedure, string> = {
  DOCUMENT_PRESENTED: 'Documento apresentado',
  CALLBACK: 'Retorno em canal já conhecido',
  IN_PERSON_CONFIRMATION: 'Confirmação presencial',
  GUARDIAN_PRESENT: 'Responsável presente',
  RECORDED_PROCEDURE: 'Procedimento registrado',
}

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  CONTACT_INFORMED: 'Contato informado',
  CONTACT_VERIFIED: 'Verificação registrada',
  CONTACT_REVOKED: 'Verificação revogada',
  AUTHORIZATION_RECORDED: 'Autorização registrada',
  AUTHORIZATION_REVOKED: 'Autorização revogada',
  ASSOCIATION_RECORDED: 'Associação registrada',
  CAMPAIGN_CREATED: 'Campanha aberta',
  CAMPAIGN_UPDATED: 'Itens alterados',
  CAMPAIGN_SUBMITTED: 'Enviada para revisão',
  CAMPAIGN_APPROVED: 'Aprovação administrativa',
  CAMPAIGN_REOPENED: 'Revisão reaberta',
  ITEM_RECLASSIFIED: 'Pendência atualizada',
}
