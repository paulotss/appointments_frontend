import { homePathForRole, isUserRole, type UserRole } from '../routes/access'

const TOKEN_KEY = 'appointments_auth_token'
const USER_KEY = 'appointments_auth_user'

export { homePathForRole }
export type { UserRole }

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function isAccessTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token)
  if (!payload) {
    return true
  }

  const exp = payload.exp
  if (typeof exp !== 'number' || !Number.isFinite(exp)) {
    return false
  }

  return Date.now() >= exp * 1000
}

export function isAuthenticated(): boolean {
  const token = getToken()
  if (!token) {
    return false
  }
  if (isAccessTokenExpired(token)) {
    clearToken()
    return false
  }
  return true
}

export interface StoredUser {
  id: number
  usernameLogin: string
  name: string
  role: UserRole
  patientId?: number | null
  healthProfessionalId?: number | null
  extension?: number | null
}

export function saveLoggedUser(user: StoredUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function getLoggedUser(): StoredUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as StoredUser
  } catch {
    return null
  }
}

function parseNumericUserIdFromPayload(payload: Record<string, unknown> | null): number | null {
  if (!payload) {
    return null
  }
  const keys = ['userId', 'user_id', 'id', 'sub'] as const
  for (const key of keys) {
    const value = payload[key]
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.trunc(value)
    }
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (/^\d+$/.test(trimmed)) {
        return Number(trimmed)
      }
    }
  }
  return null
}

export function readNumericUserIdFromToken(token: string | null): number | null {
  if (!token) {
    return null
  }
  return parseNumericUserIdFromPayload(decodeJwtPayload(token))
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const tokenParts = token.split('.')
  if (tokenParts.length < 2) {
    return null
  }

  const payload = tokenParts[1]
  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')

  try {
    return JSON.parse(atob(padded)) as Record<string, unknown>
  } catch {
    return null
  }
}

export function getLoggedUserId(): number | null {
  const user = getLoggedUser()
  if (user != null && typeof user.id === 'number' && Number.isFinite(user.id)) {
    return user.id
  }

  return readNumericUserIdFromToken(getToken())
}

export function getUserRole(): UserRole | null {
  const user = getLoggedUser()
  if (user && isUserRole(user.role)) {
    return user.role
  }

  const legacy = user as { isAdmin?: boolean } | null
  if (legacy?.isAdmin === true) {
    return 'ADMIN'
  }
  if (legacy?.isAdmin === false) {
    return 'RECEPTIONIST'
  }

  const token = getToken()
  if (!token) {
    return null
  }

  const payload = decodeJwtPayload(token)
  if (!payload) {
    return null
  }

  if (isUserRole(payload.role)) {
    return payload.role
  }
  if (payload.isAdmin === true || payload.is_admin === true) {
    return 'ADMIN'
  }
  if (payload.isAdmin === false || payload.is_admin === false) {
    return 'RECEPTIONIST'
  }

  return null
}

export function getIsAdmin(): boolean {
  return getUserRole() === 'ADMIN'
}
