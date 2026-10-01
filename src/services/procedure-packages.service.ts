import type {
  CreateProcedurePackageRequest,
  ProcedurePackage,
  ProcedurePackageItem,
  UpdateProcedurePackageRequest,
} from '../types/pacote'
import { parseValorDecimal } from '../utils/moedaBRL'
import { apiClient } from './apiClient'

interface BackendPackageItem {
  id: number
  packageId: number
  procedureId: number
  quantity: number
  procedure?: {
    id: number
    name: string
    value: string | number
    specialtyId: number
  }
}

interface BackendProcedurePackage {
  id: number
  name: string
  discountPercent: string | number
  isActive: boolean
  createdAt: string
  items?: BackendPackageItem[]
}

function mapItem(item: BackendPackageItem): ProcedurePackageItem {
  return {
    id: item.id,
    packageId: item.packageId,
    procedureId: item.procedureId,
    quantity: item.quantity,
    procedure: item.procedure,
  }
}

export function mapBackendProcedurePackage(item: BackendProcedurePackage): ProcedurePackage {
  return {
    id: item.id,
    name: item.name,
    discountPercent: parseValorDecimal(item.discountPercent) || 0,
    isActive: item.isActive,
    createdAt: item.createdAt,
    items: (item.items ?? []).map(mapItem),
  }
}

export async function listarPacotes(params?: { isActive?: boolean }): Promise<ProcedurePackage[]> {
  const response = await apiClient.get<BackendProcedurePackage[]>('/procedure-packages', { params })
  return response.data.map(mapBackendProcedurePackage)
}

export async function buscarPacote(id: number): Promise<ProcedurePackage> {
  const response = await apiClient.get<BackendProcedurePackage>(`/procedure-packages/${id}`)
  return mapBackendProcedurePackage(response.data)
}

export async function criarPacote(payload: CreateProcedurePackageRequest): Promise<ProcedurePackage> {
  const response = await apiClient.post<BackendProcedurePackage>('/procedure-packages', payload)
  return mapBackendProcedurePackage(response.data)
}

export async function atualizarPacote(
  id: number,
  payload: UpdateProcedurePackageRequest,
): Promise<ProcedurePackage> {
  const response = await apiClient.patch<BackendProcedurePackage>(`/procedure-packages/${id}`, payload)
  return mapBackendProcedurePackage(response.data)
}

export async function excluirPacote(id: number): Promise<void> {
  await apiClient.delete(`/procedure-packages/${id}`)
}
