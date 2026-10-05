import type {
  ClinicalChart,
  ClinicalChartInput,
  ClinicalEvolution,
  ClinicalEvolutionInput,
} from '../types/prontuario'
import { apiClient } from './apiClient'

export async function buscarFichaClinica(patientId: number): Promise<ClinicalChart> {
  const response = await apiClient.get<ClinicalChart>(`/patients/${patientId}/clinical-chart`)
  return response.data
}

export async function salvarFichaClinica(
  patientId: number,
  payload: ClinicalChartInput,
): Promise<ClinicalChart> {
  const response = await apiClient.put<ClinicalChart>(`/patients/${patientId}/clinical-chart`, payload)
  return response.data
}

export async function listarEvolucoes(patientId: number): Promise<ClinicalEvolution[]> {
  const response = await apiClient.get<ClinicalEvolution[]>(`/patients/${patientId}/clinical-evolutions`)
  return response.data
}

export async function criarEvolucao(
  patientId: number,
  payload: ClinicalEvolutionInput,
): Promise<ClinicalEvolution> {
  const response = await apiClient.post<ClinicalEvolution>(
    `/patients/${patientId}/clinical-evolutions`,
    payload,
  )
  return response.data
}

export async function atualizarEvolucao(
  patientId: number,
  evolutionId: number,
  payload: ClinicalEvolutionInput,
): Promise<ClinicalEvolution> {
  const response = await apiClient.patch<ClinicalEvolution>(
    `/patients/${patientId}/clinical-evolutions/${evolutionId}`,
    payload,
  )
  return response.data
}
