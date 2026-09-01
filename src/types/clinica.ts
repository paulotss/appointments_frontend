export interface ClinicProfile {
  id: number
  legalName: string | null
  cnpj: string | null
  cnes: string | null
}

export interface UpsertClinicProfileRequest {
  legalName?: string | null
  cnpj?: string | null
  cnes?: string | null
}
