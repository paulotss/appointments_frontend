import { apiClient } from './apiClient'
import type {
  CreateSpecialtyRequest,
  Especialidade,
  UpdateSpecialtyRequest,
} from '../types/registro'

interface BackendSpecialty {
  id: number
  name: string
}

function mapBackendSpecialty(item: BackendSpecialty): Especialidade {
  return {
    id: item.id,
    nome: item.name,
  }
}

export async function buscarEspecialidadePorId(id: number): Promise<Especialidade> {
  const response = await apiClient.get<BackendSpecialty>(`/specialties/${id}`)
  return mapBackendSpecialty(response.data)
}

export async function listarEspecialidadesPorIds(ids: number[]): Promise<Especialidade[]> {
  const unicos = Array.from(new Set(ids)).filter((id) => id > 0)
  const especialidades = await Promise.all(unicos.map((id) => buscarEspecialidadePorId(id)))
  return especialidades.sort((a, b) => a.nome.localeCompare(b.nome))
}

export async function criarEspecialidade(payload: CreateSpecialtyRequest): Promise<Especialidade> {
  const response = await apiClient.post<BackendSpecialty>('/specialties', payload)
  return mapBackendSpecialty(response.data)
}

export async function atualizarEspecialidade(
  id: number,
  payload: UpdateSpecialtyRequest,
): Promise<Especialidade> {
  const response = await apiClient.patch<BackendSpecialty>(`/specialties/${id}`, payload)
  return mapBackendSpecialty(response.data)
}

export async function excluirEspecialidade(id: number): Promise<void> {
  await apiClient.delete(`/specialties/${id}`)
}

export async function listarEspecialidades(): Promise<Especialidade[]> {
  const response = await apiClient.get<BackendSpecialty[]>('/specialties')
  return response.data.map(mapBackendSpecialty)
}
