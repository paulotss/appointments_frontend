import { apiClient } from './apiClient'
import { readNumericUserIdFromToken, saveLoggedUser, saveToken, type StoredUser } from './authStorage'
import type { LoginRequest, LoginResponse, LoggedUser } from '../types/auth'
import type { LoginFormValues } from '../schemas/login.schema'

function toLoginRequest(values: LoginFormValues): LoginRequest {
  return {
    usernameLogin: values.username,
    password: values.password,
  }
}

/** Monta usuario persistido: id pode vir no corpo (varias chaves) ou apenas no JWT. */
function sessionUserFromLogin(user: LoggedUser, token: string): StoredUser {
  const raw = user as LoggedUser & { userId?: number; user_id?: number; extensions?: number | null }
  const fromBody =
    typeof raw.id === 'number' && Number.isFinite(raw.id)
      ? Math.trunc(raw.id)
      : typeof raw.userId === 'number' && Number.isFinite(raw.userId)
        ? Math.trunc(raw.userId)
        : typeof raw.user_id === 'number' && Number.isFinite(raw.user_id)
          ? Math.trunc(raw.user_id)
          : null
  const fromToken = readNumericUserIdFromToken(token)
  const id = fromBody ?? fromToken
  if (id == null) {
    throw new Error('Resposta de login sem id de usuario valido')
  }
  const ext = raw.extension ?? raw.extensions
  const extension =
    ext != null && typeof ext === 'number' && Number.isFinite(ext) ? Math.trunc(ext) : null
  return {
    id,
    name: raw.name,
    usernameLogin: raw.usernameLogin,
    isAdmin: raw.isAdmin,
    extension,
  }
}

export async function login(values: LoginFormValues): Promise<LoginResponse> {
  const payload = toLoginRequest(values)
  const response = await apiClient.post<LoginResponse>('/auth/login', payload)
  const token = response.data.accessToken ?? response.data.token
  if (!token) {
    throw new Error('Resposta de login sem token')
  }
  if (response.data.user) {
    saveLoggedUser(sessionUserFromLogin(response.data.user, token))
  }
  saveToken(token)
  return response.data
}
