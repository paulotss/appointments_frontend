export interface SystemUser {
  id: number
  name: string
  usernameLogin: string
  isAdmin: boolean
  extension: number | null
}

export interface CreateUserRequest {
  name: string
  passwordHash: string
  usernameLogin: string
  isAdmin?: boolean
  extension?: number | null
}

export interface UpdateUserRequest {
  name: string
  usernameLogin: string
  isAdmin?: boolean
  passwordHash?: string
  extension?: number | null
}
