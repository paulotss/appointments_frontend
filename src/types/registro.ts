export type TipoAtendimento = 'whatsapp' | 'telefone' | 'outro'
export type SimNao = 'sim' | 'nao'

export interface RegistroAtendimento {
  id: number
  data: string
  nome: string
  telefone: string
  atendimento: TipoAtendimento
  primeira_vez: SimNao
  agendamento: SimNao
  motivo: string | null
  especialidade_id: number
  especialidade_nome?: string
  observacoes: string
  atendente: string
}

export interface CriarRegistroAtendimentoInput {
  nome: string
  telefone?: string
  atendimento: TipoAtendimento
  primeira_vez: SimNao
  agendamento: SimNao
  motivo: string | null
  especialidade_id?: number | null
  observacoes?: string
  atendente_id?: number | null
}

export interface Especialidade {
  id: number
  nome: string
}

export interface BackendAppointment {
  id: number
  date: string
  clientName: string
  phone: string
  contactMethod: 'whatsapp' | 'phone' | 'other'
  firstTime: boolean
  scheduled: boolean
  reason: string | null
  specialtyId: number
  notes: string
  attendantId: number
  specialty?: {
    id: number
    name: string
  }
  attendant?: {
    id: number
    name: string
    usernameLogin: string
    isAdmin: boolean
  }
}

export interface CreateAppointmentRequest {
  date: string
  clientName: string
  phone?: string
  contactMethod: 'whatsapp' | 'phone' | 'other'
  firstTime: boolean
  scheduled: boolean
  reason?: string
  specialtyId?: number | null
  notes?: string
  attendantId?: number | null
}

export interface CreateSpecialtyRequest {
  name: string
}

export interface UpdateSpecialtyRequest {
  name: string
}
