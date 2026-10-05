import type {
  CreatePatientPackageRequest,
  PatientPackage,
  PatientPackageItem,
  PatientPackageStatus,
} from '../types/pacote'
import { parseValorDecimal } from '../utils/moedaBRL'
import { apiClient } from './apiClient'

interface BackendPatientPackageItem {
  id: number
  patientPackageId: number
  procedureId: number
  quantity: number
  usedQuantity: number
  unitValue: string | number
  remainingQuantity?: number
  reservedQuantity?: number
  procedure?: {
    id: number
    name: string
    value: string | number
    specialtyId: number
  }
}

interface BackendPatientPackage {
  id: number
  patientId: number
  packageId: number
  status: PatientPackageStatus
  assignedAt: string
  package?: { id: number; name: string; discountPercent: string | number }
  patient?: { id: number; name: string }
  items?: BackendPatientPackageItem[]
}

function mapItem(item: BackendPatientPackageItem): PatientPackageItem {
  const quantity = item.quantity
  const usedQuantity = item.usedQuantity
  const reservedQuantity = item.reservedQuantity ?? 0
  return {
    id: item.id,
    patientPackageId: item.patientPackageId,
    procedureId: item.procedureId,
    quantity,
    usedQuantity,
    unitValue: parseValorDecimal(item.unitValue) || 0,
    reservedQuantity,
    remainingQuantity:
      item.remainingQuantity ?? Math.max(0, quantity - usedQuantity - reservedQuantity),
    procedure: item.procedure,
  }
}

export function mapBackendPatientPackage(item: BackendPatientPackage): PatientPackage {
  return {
    id: item.id,
    patientId: item.patientId,
    packageId: item.packageId,
    status: item.status,
    assignedAt: item.assignedAt,
    package: item.package
      ? {
          id: item.package.id,
          name: item.package.name,
          discountPercent: parseValorDecimal(item.package.discountPercent) || 0,
        }
      : undefined,
    patient: item.patient,
    items: (item.items ?? []).map(mapItem),
  }
}

export async function listarPacotesDoPaciente(
  patientId: number,
  excludeAppointmentId?: number,
): Promise<PatientPackage[]> {
  const response = await apiClient.get<BackendPatientPackage[]>('/patient-packages', {
    params: {
      patientId,
      ...(excludeAppointmentId != null ? { excludeAppointmentId } : {}),
    },
  })
  return response.data.map(mapBackendPatientPackage)
}

export async function atribuirPacoteAoPaciente(
  payload: CreatePatientPackageRequest,
): Promise<PatientPackage> {
  const response = await apiClient.post<BackendPatientPackage>('/patient-packages', payload)
  return mapBackendPatientPackage(response.data)
}

export async function cancelarPacoteDoPaciente(id: number): Promise<PatientPackage> {
  const response = await apiClient.post<BackendPatientPackage>(`/patient-packages/${id}/cancel`)
  return mapBackendPatientPackage(response.data)
}
