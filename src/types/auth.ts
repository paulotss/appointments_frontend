export interface LoggedUser {
  id: number
  usernameLogin: string
  isAdmin: boolean
  name: string
  extension?: number | null
}

export interface LoginRequest {
  usernameLogin: string
  password: string
}

export interface LoginResponse {
  accessToken?: string
  token?: string
  user?: LoggedUser
}
