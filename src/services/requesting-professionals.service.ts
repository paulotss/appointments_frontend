import type { CouncilType } from '../types/profissional'
import { apiClient } from './apiClient'

export interface RequestingProfessional {
  id: number
  name: string
  councilType: CouncilType
  councilNumber: string
  councilUf: string
  cbosCode: string
  label: string
}

export function buscarProfissionaisSolicitantes(q: string): Promise<RequestingProfessional[]> {
  return apiClient
    .get<RequestingProfessional[]>('/requesting-professionals', {
      params: q.trim() ? { q: q.trim() } : undefined,
    })
    .then((response) => response.data)
}
