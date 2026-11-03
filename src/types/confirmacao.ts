export type CampaignSourceKey = 'SAUDEVIANET' | 'HIGIA'
export type CampaignAdminStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED'
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
}
