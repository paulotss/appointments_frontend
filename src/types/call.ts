export type CallRecordStatus = 'pending' | 'registered' | 'cancelled'

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
  extension: number
  status: string
  recordStatus: CallRecordStatus
  note: string | null
  userId: number | null
  user: CallUser | null
}
