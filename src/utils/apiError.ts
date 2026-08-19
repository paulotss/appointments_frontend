import axios from 'axios'

const MENSAGENS_EXATAS: Record<string, string> = {
  'tissCode already exists': 'Já existe um procedimento com este código TISS.',
  'Procedure cannot be removed because it is in use':
    'O procedimento não pode ser removido porque está em uso.',
  'healthPlanPrices cannot contain duplicate healthPlanId':
    'Há planos duplicados na tabela de valores por convênio.',
  'Insurance guide cannot be removed because it is in use':
    'A guia não pode ser removida porque está em uso.',
  'insuranceGuideIds is required when type is health_plan':
    'Selecione ao menos uma guia quando o agendamento for de plano de saúde.',
  'insuranceGuideIds must be omitted when type is private':
    'Agendamento particular não deve ter guia associada.',
  'insuranceGuideId is required when type is health_plan':
    'Selecione ao menos uma guia quando o agendamento for de plano de saúde.',
  'insuranceGuideId must be omitted when type is private':
    'Agendamento particular não deve ter guia associada.',
  'procedureIds is required when type is private':
    'Selecione ao menos um procedimento para o agendamento particular.',
  'procedureIds must be omitted when type is health_plan; procedures are copied from the insurance guides':
    'No plano de saúde os procedimentos vêm das guias e não devem ser enviados.',
  'procedureIds must be omitted when type is health_plan; procedures are copied from the insurance guide':
    'No plano de saúde os procedimentos vêm das guias e não devem ser enviados.',
  'procedureIds is required when changing type to private':
    'Selecione os procedimentos ao alterar o tipo para particular.',
}

const PADROES: Array<[RegExp, string]> = [
  [/^Specialty \d+ not found$/i, 'Especialidade não encontrada.'],
  [/^Health plan \d+ not found$/i, 'Plano de saúde não encontrado.'],
  [/^Procedure \d+ not found$/i, 'Procedimento não encontrado.'],
  [/^Patient \d+ not found$/i, 'Paciente não encontrado.'],
  [/^Clinical appointment \d+ not found$/i, 'Agendamento clínico não encontrado.'],
  [
    /^Health professional \d+ does not have specialty \d+ required by procedure \d+$/i,
    'O profissional não atende a especialidade exigida pelo procedimento.',
  ],
  [
    /^Procedure \d+ has no price for health plan \d+$/i,
    'O procedimento não tem preço cadastrado para este plano de saúde.',
  ],
  [
    /^Cannot remove procedure \d+ from insurance guide because usedQuantity is \d+$/i,
    'Não é possível remover o procedimento da guia porque já há quantidade utilizada.',
  ],
  [
    /^authorizedQuantity for procedure \d+ cannot be less than usedQuantity \d+$/i,
    'A quantidade autorizada não pode ser menor que a quantidade já utilizada.',
  ],
  [/^Insurance guide \d+ does not belong to patient \d+$/i, 'A guia não pertence a este paciente.'],
  [
    /^Insurance guide \d+ does not belong to health professional \d+$/i,
    'A guia não pertence a este profissional.',
  ],
  [/^Insurance guide \d+ is already billed$/i, 'A guia já foi faturada e não pode ser associada.'],
  [/^Insurance guide \d+ has no procedures$/i, 'A guia não possui procedimentos.'],
  [
    /^Procedure \d+ has no remaining quantity on insurance guide \d+$/i,
    'Há procedimento sem quantidade disponível na guia.',
  ],
]

function traduzirMensagem(mensagem: string): string {
  const exata = MENSAGENS_EXATAS[mensagem]
  if (exata) return exata
  for (const [padrao, traducao] of PADROES) {
    if (padrao.test(mensagem)) return traducao
  }
  return mensagem
}

export function mensagemErroApi(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) return fallback
  const data = error.response?.data as { message?: string | string[] } | undefined
  const raw = data?.message
  if (typeof raw === 'string' && raw.trim()) return traduzirMensagem(raw.trim())
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map((item) => traduzirMensagem(String(item))).join(' ')
  }
  return fallback
}
