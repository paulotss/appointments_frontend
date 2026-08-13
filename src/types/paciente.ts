export interface Patient {
  id: number
  name: string
  phone: string
  email: string | null
  birthDate: string
  cpf: string
}

export interface CreatePatientRequest {
  name: string
  phone: string
  email?: string
  birthDate: string
  cpf: string
}

export interface UpdatePatientRequest {
  name?: string
  phone?: string
  email?: string | null
  birthDate?: string
  cpf?: string
}
