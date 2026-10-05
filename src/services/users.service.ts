import { isUserRole } from '../routes/access'
import type { UserRole } from '../routes/access'
import { apiClient } from './apiClient'
import type { CreateUserRequest, SystemUser, UpdateUserRequest } from '../types/user'

interface BackendUser {
  id: number
  name: string
  usernameLogin: string
  email?: string | null
  role?: UserRole
  isAdmin?: boolean
  is_admin?: boolean
  patientId?: number | null
  healthProfessionalId?: number | null
  patient?: { id: number; name: string } | null
  healthProfessional?: { id: number; name: string } | null
  extension?: number | null
  extensions?: number | null
}

function mapBackendUser(item: BackendUser): SystemUser {
  const raw = item.extension ?? item.extensions
  const role = isUserRole(item.role)
    ? item.role
    : item.isAdmin || item.is_admin
      ? 'ADMIN'
      : 'RECEPTIONIST'
  return {
    id: item.id,
    name: item.name,
    usernameLogin: item.usernameLogin,
    email: item.email?.trim() ? item.email.trim() : null,
    role,
    patientId: item.patient?.id ?? item.patientId ?? null,
    patientName: item.patient?.name ?? null,
    healthProfessionalId: item.healthProfessional?.id ?? item.healthProfessionalId ?? null,
    healthProfessionalName: item.healthProfessional?.name ?? null,
    extension: raw != null && Number.isFinite(raw) ? Math.trunc(raw) : null,
  }
}

export async function listarUsuarios(): Promise<SystemUser[]> {
  const response = await apiClient.get<BackendUser[]>('/users')
  return response.data.map(mapBackendUser)
}

export async function criarUsuario(payload: CreateUserRequest): Promise<SystemUser> {
  const response = await apiClient.post<BackendUser>('/users', payload)
  return mapBackendUser(response.data)
}

export async function atualizarUsuario(id: number, payload: UpdateUserRequest): Promise<SystemUser> {
  const response = await apiClient.patch<BackendUser>(`/users/${id}`, payload)
  return mapBackendUser(response.data)
}

export async function excluirUsuario(id: number): Promise<void> {
  await apiClient.delete(`/users/${id}`)
}
