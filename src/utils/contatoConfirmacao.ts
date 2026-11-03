import type { CampaignItem, ContactAuthorization } from '../types/confirmacao'

const BLOQUEIO_OPERACIONAL = new Set([
  'query_failed',
  'registry_unavailable',
  'revalidation_mismatch',
  'unexpected_response',
  'source_not_configured',
  'ambiguous',
  'reclassification_unavailable',
  'partial_consultation',
])

export function pendenciaResolvivel(item: CampaignItem): boolean {
  if (item.recipientState !== 'PENDING' || !item.patientRef || !item.recipientRef) {
    return false
  }
  return !(item.reasonCode && BLOQUEIO_OPERACIONAL.has(item.reasonCode))
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
