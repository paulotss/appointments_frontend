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

interface StoredUser {
  id: number
  usernameLogin: string
  isAdmin: boolean
  name: string
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
  if (user?.id) {
    return user.id
  }

  const token = getToken()
  if (!token) {
    return null
  }

  const payload = decodeJwtPayload(token)
  if (!payload) {
    return null
  }

  const sub = payload.sub
  if (typeof sub === 'number') {
    return sub
  }
  if (typeof sub === 'string') {
    const parsed = Number(sub)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
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
