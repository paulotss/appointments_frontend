import type { UserRole } from '../routes/access'

export interface LoggedUser {
  id: number
  usernameLogin: string
  name: string
  role: UserRole
  patientId?: number | null
  healthProfessionalId?: number | null
  extension?: number | null
}

export interface LoginRequest {
  usernameLogin: string
  password: string
}

export interface LoginResponse {
  accessToken?: string
  token?: string
  user?: LoggedUser
}
