import type { CouncilType } from '../types/profissional'
import { isCouncilType } from '../types/profissional'
import type { SolicitanteFormValue } from '../components/ProfissionalSolicitanteFields'
import { SOLICITANTE_VAZIO } from '../components/ProfissionalSolicitanteFields'

export interface CamposTissGuia {
  executorCbosCode: string
  tissGuideType?: 'consulta' | 'sp_sadt' | null
  requesterName?: string
  requesterCouncilType?: string
  requesterCouncilNumber?: string
  requesterCouncilUf?: string
  requesterCbosCode?: string
  saveRequesterForNextAuthorizations?: boolean
}

export function payloadTissGuia(values: CamposTissGuia) {
  const base = { executorCbosCode: values.executorCbosCode.replace(/\D/g, '') }
  if (values.tissGuideType !== 'sp_sadt') return base
  return {
    ...base,
    requester: {
      name: (values.requesterName ?? '').trim(),
      councilType: values.requesterCouncilType as CouncilType,
      councilNumber: (values.requesterCouncilNumber ?? '').trim(),
      councilUf: (values.requesterCouncilUf ?? '').trim().toUpperCase(),
      cbosCode: (values.requesterCbosCode ?? '').replace(/\D/g, ''),
    },
    saveRequesterForNextAuthorizations: Boolean(values.saveRequesterForNextAuthorizations),
  }
}

export function solicitanteDaGuia(guia: {
  requesterName?: string | null
  requesterCouncilType?: string | null
  requesterCouncilNumber?: string | null
  requesterCouncilUf?: string | null
  requesterCbosCode?: string | null
}): SolicitanteFormValue {
  const council = guia.requesterCouncilType ?? ''
  return {
    name: guia.requesterName ?? '',
    councilType: isCouncilType(council) ? council : '',
    councilNumber: guia.requesterCouncilNumber ?? '',
    councilUf: guia.requesterCouncilUf ?? '',
    cbosCode: (guia.requesterCbosCode ?? '').replace(/\D/g, ''),
    saveForNext: false,
  }
}

export function solicitanteIncompleto(value: SolicitanteFormValue): boolean {
  return (
    value.name.trim().length < 3 ||
    !value.councilType ||
    value.councilNumber.trim().length < 1 ||
    value.councilUf.trim().length !== 2 ||
    !/^\d{6}$/.test(value.cbosCode)
  )
}

export function solicitanteVazio(): SolicitanteFormValue {
  return { ...SOLICITANTE_VAZIO }
}
