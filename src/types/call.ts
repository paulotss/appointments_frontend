import type { BackendAppointment } from './registro'

export type CallRecordStatus = 'pending' | 'registered' | 'cancelled'

export type CallStatus = 'ATENDIDO' | 'NAO_ATENDIDO' | 'REALIZADO'

export interface CallUser {
  id: number
  name: string
  usernameLogin: string
  isAdmin: boolean
  extension: number | null
}

export interface Call {
  id: number
  receivedAt: string
  origin: string
  destination: string | null
  extension: number
  status: CallStatus
  recordStatus: CallRecordStatus
  note: string | null
  userId: number | null
  user: CallUser | null
  /** Somente leitura: registro de atendimento vinculado, quando existir. */
  appointment?: BackendAppointment | null
}
