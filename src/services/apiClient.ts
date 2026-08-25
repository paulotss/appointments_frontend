import axios from 'axios'
import { clearToken, getToken, isAccessTokenExpired } from './authStorage'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

let redirecionandoParaLogin = false

function isRotaDeLogin(url?: string): boolean {
  if (!url) {
    return false
  }
  return url.includes('/auth/login')
}

function redirecionarParaLogin(): void {
  if (redirecionandoParaLogin) {
    return
  }
  redirecionandoParaLogin = true
  clearToken()
  if (window.location.pathname !== '/login') {
    window.location.replace('/login')
  }
}

apiClient.interceptors.request.use((config) => {
  if (isRotaDeLogin(config.url)) {
    return config
  }

  const token = getToken()
  if (token) {
    if (isAccessTokenExpired(token)) {
      redirecionarParaLogin()
      return Promise.reject(new axios.CanceledError('Sessão expirada'))
    }
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      if (!isRotaDeLogin(error.config?.url)) {
        redirecionarParaLogin()
      }
    }
    return Promise.reject(error)
  },
)
