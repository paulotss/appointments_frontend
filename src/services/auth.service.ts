import { apiClient } from './apiClient'
import { saveLoggedUser, saveToken } from './authStorage'
import type { LoginRequest, LoginResponse } from '../types/auth'
import type { LoginFormValues } from '../schemas/login.schema'

function toLoginRequest(values: LoginFormValues): LoginRequest {
  return {
    usernameLogin: values.username,
    password: values.password,
  }
}

export async function login(values: LoginFormValues): Promise<LoginResponse> {
  const payload = toLoginRequest(values)
  const response = await apiClient.post<LoginResponse>('/auth/login', payload)
  const token = response.data.accessToken ?? response.data.token
  if (!token) {
    throw new Error('Resposta de login sem token')
  }
  saveToken(token)
  if (response.data.user) {
    saveLoggedUser(response.data.user)
  }
  return response.data
}
