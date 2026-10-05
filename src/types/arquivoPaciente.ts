export type PatientFileKind = 'MEDICAL_ORDER' | 'PRESCRIPTION' | 'OTHER'

export type PatientFileOrigin = 'UPLOAD' | 'GENERATED'

export type GeneratedFileKind = 'MEDICAL_ORDER' | 'PRESCRIPTION'

export const PATIENT_FILE_KIND_LABELS: Record<PatientFileKind, string> = {
  MEDICAL_ORDER: 'Pedido médico',
  PRESCRIPTION: 'Receituário',
  OTHER: 'Outros',
}

export const PATIENT_FILE_ORIGIN_LABELS: Record<PatientFileOrigin, string> = {
  UPLOAD: 'Enviado',
  GENERATED: 'Gerado',
}

export interface MedicationLine {
  name: string
  dosage: string
  quantity: string
}

export interface PrescriptionContent {
  date: string
  professionalName: string
  professionalCouncil: string
  medications: MedicationLine[]
  notes: string
}

export interface MedicalOrderItem {
  description: string
}

export interface MedicalOrderContent {
  date: string
  professionalName: string
  professionalCouncil: string
  indication: string
  items: MedicalOrderItem[]
}

export type GeneratedDocumentContent = PrescriptionContent | MedicalOrderContent

export interface PatientFileAuthor {
  id: number
  name: string
}

export interface PatientFile {
  id: number
  patientId: number
  kind: PatientFileKind
  origin: PatientFileOrigin
  title: string | null
  originalName: string | null
  mimeType: string | null
  sizeBytes: number | null
  content: GeneratedDocumentContent | null
  createdAt: string
  updatedAt: string
  createdBy: PatientFileAuthor
}
