import { apiClient } from './apiClient'
import type { CreateUserRequest, SystemUser, UpdateUserRequest } from '../types/user'

interface BackendUser {
  id: number
  name: string
  usernameLogin: string
  isAdmin?: boolean
  is_admin?: boolean
}

function mapBackendUser(item: BackendUser): SystemUser {
  return {
    id: item.id,
    name: item.name,
    usernameLogin: item.usernameLogin,
    isAdmin: item.isAdmin ?? item.is_admin ?? false,
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
