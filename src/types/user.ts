export interface SystemUser {
  id: number
  name: string
  usernameLogin: string
  isAdmin: boolean
}

export interface CreateUserRequest {
  name: string
  passwordHash: string
  usernameLogin: string
  isAdmin?: boolean
}

export interface UpdateUserRequest {
  name: string
  usernameLogin: string
  isAdmin?: boolean
  passwordHash?: string
}
