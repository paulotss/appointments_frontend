import {
  guiasDoAgendamento,
  type ClinicalAppointment,
} from '../types/agendamentoClinico'
import type { InsuranceGuide, InsuranceGuideProcedure } from '../types/guia'
import { saldoGuiaProcedimento } from '../types/guia'

export type LinhaProcedimentoGuia = InsuranceGuideProcedure & {
  guia: InsuranceGuide
}

export function procedimentoSemSaldo(
  item: Pick<InsuranceGuideProcedure, 'authorizedQuantity' | 'usedQuantity' | 'procedure'>,
): boolean {
  return saldoGuiaProcedimento(item) <= 0
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
