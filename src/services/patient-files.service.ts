import type {
  GeneratedDocumentContent,
  GeneratedFileKind,
  PatientFile,
  PatientFileKind,
  PatientFileOrigin,
} from '../types/arquivoPaciente'
import { apiClient } from './apiClient'

interface BackendPatientFile {
  id: number
  patientId: number
  kind: PatientFileKind
  origin: PatientFileOrigin
  title?: string | null
  originalName?: string | null
  mimeType?: string | null
  sizeBytes?: number | null
  content?: GeneratedDocumentContent | null
  createdAt: string
  updatedAt: string
  createdBy: { id: number; name: string }
}

function mapPatientFile(item: BackendPatientFile): PatientFile {
  return {
    id: item.id,
    patientId: item.patientId,
    kind: item.kind,
    origin: item.origin,
    title: item.title ?? null,
    originalName: item.originalName ?? null,
    mimeType: item.mimeType ?? null,
    sizeBytes: item.sizeBytes ?? null,
    content: item.content ?? null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    createdBy: item.createdBy,
  }
}

export async function listarArquivosPaciente(patientId: number): Promise<PatientFile[]> {
  const response = await apiClient.get<BackendPatientFile[]>(`/patients/${patientId}/files`)
  return response.data.map(mapPatientFile)
}

export async function enviarArquivoPaciente(
  patientId: number,
  kind: PatientFileKind,
  file: File,
): Promise<PatientFile> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('kind', kind)
  const response = await apiClient.post<BackendPatientFile>(`/patients/${patientId}/files`, formData, {
    headers: { 'Content-Type': false },
  })
  return mapPatientFile(response.data)
}

export async function criarDocumentoGerado(
  patientId: number,
  kind: GeneratedFileKind,
  content: GeneratedDocumentContent,
): Promise<PatientFile> {
  const response = await apiClient.post<BackendPatientFile>(`/patients/${patientId}/files/generated`, {
    kind,
    content,
  })
  return mapPatientFile(response.data)
}

export async function atualizarDocumentoGerado(
  patientId: number,
  fileId: number,
  content: GeneratedDocumentContent,
): Promise<PatientFile> {
  const response = await apiClient.patch<BackendPatientFile>(
    `/patients/${patientId}/files/${fileId}`,
    { content },
  )
  return mapPatientFile(response.data)
}

export async function baixarArquivoPaciente(patientId: number, fileId: number): Promise<Blob> {
  const response = await apiClient.get<Blob>(`/patients/${patientId}/files/${fileId}/download`, {
    responseType: 'blob',
  })
  return response.data
}

export async function removerArquivoPaciente(patientId: number, fileId: number): Promise<void> {
  await apiClient.delete(`/patients/${patientId}/files/${fileId}`)
}
