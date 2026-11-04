import type { CampaignItem, ContactAuthorization } from '../types/confirmacao'

const RECEPCAO_PODE_RESOLVER = new Set([
  'verification_missing',
  'ownership_revoked',
  'minor_guardian_missing',
])

const AUTORIZACAO = new Set([
  'authorization_missing',
  'authorization_revoked',
])

export function falhaDeConsulta(item: CampaignItem): boolean {
  return item.appointmentRef.startsWith('fail:')
}

export function pendenciaResolvivel(item: CampaignItem): boolean {
  return item.recipientState === 'PENDING'
    && Boolean(item.patientRef)
    && Boolean(item.recipientRef)
    && Boolean(item.reasonCode && RECEPCAO_PODE_RESOLVER.has(item.reasonCode))
    && !falhaDeConsulta(item)
}

export function acaoDaPendencia(item: CampaignItem): string | null {
  if (pendenciaResolvivel(item)) {
    return null
  }
  if (falhaDeConsulta(item)) {
    return 'Correção técnica'
  }
  if (item.reasonCode && AUTORIZACAO.has(item.reasonCode)) {
    return 'Autorização fora desta tela'
  }
  if (item.reasonCode === 'registry_unavailable') {
    return 'Correção técnica'
  }
  if (item.recipientState === 'UNAVAILABLE' || item.reasonCode === 'age_unknown') {
    return 'Correção técnica'
  }
  return null
}

export function situacaoAutorizacao(
  autorizacoes: ContactAuthorization[],
  agora = new Date(),
): 'pendente' | 'vigente' | 'revogada' {
  const vigente = autorizacoes.some((item) => {
    if (item.revokedAt) return false
    const inicio = new Date(item.validFrom)
    const fim = new Date(item.expiresAt)
    return !Number.isNaN(inicio.getTime()) && !Number.isNaN(fim.getTime()) && inicio <= agora && agora < fim
  })
  if (vigente) return 'vigente'
  if (autorizacoes.length > 0) return 'revogada'
  return 'pendente'
}
