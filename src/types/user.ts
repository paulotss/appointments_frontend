import type { UserRole } from '../routes/access'

export interface SystemUser {
  id: number
  name: string
  usernameLogin: string
  email: string | null
  role: UserRole
  patientId: number | null
  patientName: string | null
  healthProfessionalId: number | null
  healthProfessionalName: string | null
  extension: number | null
}

export interface CreateUserRequest {
  name: string
  passwordHash: string
  usernameLogin: string
  email?: string | null
  role: UserRole
  patientId?: number | null
  healthProfessionalId?: number | null
  extension?: number | null
}

export interface UpdateUserRequest {
  name: string
  usernameLogin: string
  email?: string | null
  role: UserRole
  patientId?: number | null
  healthProfessionalId?: number | null
  passwordHash?: string
  extension?: number | null
}
