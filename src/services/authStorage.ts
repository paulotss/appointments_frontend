const TOKEN_KEY = 'appointments_auth_token'
const USER_KEY = 'appointments_auth_user'

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

export function isAuthenticated(): boolean {
  return Boolean(getToken())
}

export interface StoredUser {
  id: number
  usernameLogin: string
  isAdmin: boolean
  name: string
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

export function getIsAdmin(): boolean {
  const user = getLoggedUser()
  if (typeof user?.isAdmin === 'boolean') {
    return user.isAdmin
  }

  const token = getToken()
  if (!token) {
    return false
  }

  const payload = decodeJwtPayload(token)
  if (!payload) {
    return false
  }

  if (typeof payload.isAdmin === 'boolean') {
    return payload.isAdmin
  }
  if (typeof payload.is_admin === 'boolean') {
    return payload.is_admin
  }

  return false
}
