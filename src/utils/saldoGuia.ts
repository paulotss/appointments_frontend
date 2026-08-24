import {
  guiasDoAgendamento,
  type ClinicalAppointment,
  type ClinicalAppointmentStatus,
} from '../types/agendamentoClinico'
import type { InsuranceGuide, InsuranceGuideProcedure } from '../types/guia'
import { guiaProcedimentosTotalmenteUtilizados, saldoGuiaProcedimento } from '../types/guia'

const STATUS_QUE_RESERVAM_SALDO: ReadonlySet<ClinicalAppointmentStatus> = new Set([
  'marked',
  'confirmed',
  'waiting',
  'attended',
])

export type LinhaProcedimentoGuia = InsuranceGuideProcedure & {
  guia: InsuranceGuide
}

export function procedimentoSemSaldo(
  item: Pick<InsuranceGuideProcedure, 'authorizedQuantity' | 'usedQuantity' | 'procedure'>,
): boolean {
  return saldoGuiaProcedimento(item) <= 0
}

export function guiaElegivelParaAgendamento(
  guia: Pick<InsuranceGuide, 'isBilled' | 'procedures'>,
): boolean {
  return (
    guia.isBilled === false &&
    guia.procedures.length > 0 &&
    !guiaProcedimentosTotalmenteUtilizados(guia.procedures)
  )
}

export function saldoDisponivelGuia(guia: Pick<InsuranceGuide, 'procedures'>): number {
  if (guia.procedures.length === 0) return 0
  return Math.min(...guia.procedures.map((item) => saldoGuiaProcedimento(item)))
}

export function agendamentoReservaSaldoGuia(
  agendamento: Pick<ClinicalAppointment, 'status'>,
): boolean {
  return STATUS_QUE_RESERVAM_SALDO.has(agendamento.status)
}

export function reservasPorGuiaAPartirDeIds(
  idsPorGuia: Record<number, number[]>,
  ignorarAgendamentoId?: number | null,
): Map<number, number> {
  const mapa = new Map<number, number>()
  for (const [guiaId, ids] of Object.entries(idsPorGuia)) {
    const quantidade = ids.filter((id) => id !== ignorarAgendamentoId).length
    mapa.set(Number(guiaId), quantidade)
  }
  return mapa
}

export function guiaTemSaldoLivreParaAgendamento(
  guia: Pick<InsuranceGuide, 'id' | 'isBilled' | 'procedures'>,
  reservasPorGuia: Map<number, number>,
): boolean {
  if (!guiaElegivelParaAgendamento(guia)) return false
  const reservados = reservasPorGuia.get(guia.id) ?? 0
  return reservados < saldoDisponivelGuia(guia)
}

export function mensagemSaldoReservadoEmAgendamentos(
  guias: Pick<InsuranceGuide, 'id'>[],
): string | null {
  if (guias.length === 0) return null
  const ids = guias.map((guia) => `#${guia.id}`)
  const lista =
    ids.length === 1
      ? ids[0]
      : ids.length === 2
        ? `${ids[0]} e ${ids[1]}`
        : `${ids.slice(0, -1).join(', ')} e ${ids[ids.length - 1]}`
  if (guias.length === 1) {
    return `O saldo da guia ${lista} já está sendo usado em outros agendamentos.`
  }
  return `O saldo das guias ${lista} já está sendo usado em outros agendamentos.`
}

export function linhasProcedimentosDasGuias(guias: InsuranceGuide[]): LinhaProcedimentoGuia[] {
  return guias.flatMap((guia) => guia.procedures.map((item) => ({ ...item, guia })))
}

export function mensagensSemSaldo(guias: InsuranceGuide[]): string[] {
  return linhasProcedimentosDasGuias(guias)
    .filter(procedimentoSemSaldo)
    .map(
      (item) =>
        `Procedimento ${item.procedure?.name ?? item.procedureId} sem quantidade disponível na guia #${item.guia.id}`,
    )
}

export function podeFinalizarPlano(agendamento: ClinicalAppointment): boolean {
  if (agendamento.type !== 'health_plan') return true
  const guias = guiasDoAgendamento(agendamento)
  if (guias.length === 0) return false
  if (agendamento.status === 'finished') return true
  return linhasProcedimentosDasGuias(guias).every((item) => saldoGuiaProcedimento(item) > 0)
}

export function motivoBloqueioFinalizado(agendamento: ClinicalAppointment): string | null {
  if (podeFinalizarPlano(agendamento)) return null
  const msgs = mensagensSemSaldo(guiasDoAgendamento(agendamento))
  return msgs[0] ?? 'Há procedimento sem quantidade disponível na guia.'
}
