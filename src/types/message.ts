import type { CallRecordStatus } from './call'
import type { BackendAppointment } from './registro'

export type MessageRecordStatus = CallRecordStatus

export interface MessageUser {
  id: number
  name: string
  usernameLogin: string
  isAdmin: boolean
  extension: number | null
  email?: string | null
}

export interface Message {
  id: number
  finishAt: string
  recipient: string
  userId: number | null
  note: string | null
  recordStatus: MessageRecordStatus
  interactionId: string
  content: unknown | null
  user: MessageUser | null
  /** Somente leitura: registro de atendimento vinculado, quando existir. */
  appointment?: BackendAppointment | null
}
