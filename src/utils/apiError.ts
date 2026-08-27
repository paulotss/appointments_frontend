import axios from 'axios'

const MENSAGENS_EXATAS: Record<string, string> = {
  'tissCode already exists': 'Já existe um procedimento com este código TISS.',
  'tissCode already exists for this health plan': 'Já existe este código TISS neste plano de saúde.',
  'endsAt must be after scheduledAt': 'O horário final deve ser depois do horário de início.',
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
  'Financial entry of private procedures requires a private clinical appointment':
    'A entrada de procedimento particular exige um agendamento particular.',
  'Clinical appointment must be finished to register payment':
    'O agendamento precisa estar finalizado para registrar a entrada.',
  'Clinical appointment has no procedures to bill':
    'O agendamento não possui procedimentos para faturar.',
  'discountAmount and surchargeAmount must be >= 0':
    'Desconto e acréscimo não podem ser negativos.',
  'Charged amount cannot be negative': 'O valor líquido não pode ser negativo.',
  'file is required': 'Envie um arquivo.',
  'Only PDF, JPEG and PNG documents are allowed':
    'Somente documentos PDF, JPEG e PNG são permitidos.',
  'File too large': 'O arquivo excede o tamanho máximo permitido.',
  'Only open billing batches can be updated': 'Somente lotes abertos podem ser atualizados.',
  'Only open billing batches can be billed': 'Somente lotes abertos podem ser faturados.',
  'Cannot bill a batch without guides': 'Não é possível faturar um lote sem guias.',
  'Cannot bill a batch with zero amount': 'Não é possível faturar um lote com valor zero.',
  'Only billed batches can receive payment': 'Somente lotes faturados podem registrar recebimento.',
  'receivedAmount cannot be greater than billedAmount':
    'O valor recebido não pode ser maior que o valor faturado.',
  'receivedAmount must be >= 0': 'O valor recebido não pode ser negativo.',
  'Items received amounts must equal receivedAmount':
    'A soma dos valores recebidos das guias deve ser igual ao valor recebido do lote.',
  'Settled billing batches cannot be cancelled': 'Lotes quitados não podem ser cancelados.',
  'Billing batch is already cancelled': 'O lote já está cancelado.',
  'Cannot cancel a billed batch after payment was received':
    'Não é possível cancelar um lote depois do recebimento.',
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
  [/^Insurance guide \d+ not found$/i, 'Guia não encontrada.'],
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
  [/^Financial entry \d+ not found$/i, 'Entrada financeira não encontrada.'],
  [/^Financial exit \d+ not found$/i, 'Saída financeira não encontrada.'],
  [/^Payable \d+ not found$/i, 'Pagamento não encontrado.'],
  [/^Supplier \d+ not found$/i, 'Fornecedor não encontrado.'],
  [/^Billing batch \d+ not found$/i, 'Lote não encontrado.'],
  [/^Document \d+ not found$/i, 'Documento não encontrado.'],
  [/^Clinical appointment \d+ already has a financial entry$/i, 'Este agendamento já possui uma entrada financeira.'],
  [/^Only pending payables can be \w+$/i, 'Somente pagamentos pendentes podem ser alterados ou faturados.'],
  [/^Billing batch \d+ has no pending financial entry$/i, 'O lote não possui entrada financeira pendente.'],
  [
    /^Insurance guide \d+ does not belong to health plan \d+$/i,
    'A guia não pertence ao plano de saúde selecionado.',
  ],
  [/^Insurance guide \d+ is not eligible for billing$/i, 'A guia não está elegível para faturamento.'],
  [
    /^Insurance guide \d+ is not in billing batch \d+$/i,
    'A guia não faz parte deste lote.',
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
