import { apiClient } from './apiClient'
import { getLoggedUserId } from './authStorage'
import type {
  BackendAppointment,
  CreateAppointmentRequest,
  CriarRegistroAtendimentoInput,
  RegistroAtendimento,
} from '../types/registro'

function mapContactMethod(contactMethod: BackendAppointment['contactMethod']) {
  if (contactMethod === 'phone') {
    return 'telefone'
  }
  if (contactMethod === 'other') {
    return 'outro'
  }
  return 'whatsapp'
}

function mapAppointmentToRegistro(item: BackendAppointment): RegistroAtendimento {
  return {
    id: item.id,
    data: item.date,
    nome: item.clientName,
    telefone: item.phone,
    atendimento: mapContactMethod(item.contactMethod),
    primeira_vez: item.firstTime ? 'sim' : 'nao',
    agendamento: item.scheduled ? 'sim' : 'nao',
    motivo: item.reason,
    especialidade_id: item.specialtyId,
    especialidade_nome: item.specialty?.name,
    observacoes: item.notes,
    atendente: item.attendant?.name ?? `ID ${item.attendantId}`,
  }
}

function mapContactMethodToBackend(
  atendimento: CriarRegistroAtendimentoInput['atendimento'],
): CreateAppointmentRequest['contactMethod'] {
  if (atendimento === 'telefone') {
    return 'phone'
  }
  if (atendimento === 'outro') {
    return 'other'
  }
  return 'whatsapp'
}

function mapCriarRegistroToAppointment(
  payload: CriarRegistroAtendimentoInput,
): CreateAppointmentRequest {
  const loggedUserId = getLoggedUserId()

  return {
    date: new Date().toISOString(),
    clientName: payload.nome,
    phone: payload.telefone?.trim() || undefined,
    contactMethod: mapContactMethodToBackend(payload.atendimento),
    firstTime: payload.primeira_vez === 'sim',
    scheduled: payload.agendamento === 'sim',
    reason: payload.motivo?.trim() || undefined,
    specialtyId: payload.especialidade_id ?? null,
    notes: payload.observacoes?.trim() || undefined,
    attendantId: loggedUserId ?? payload.atendente_id ?? null,
  }
}

export async function listarRegistros(): Promise<RegistroAtendimento[]> {
  const response = await apiClient.get<BackendAppointment[]>('/appointments')
  return response.data.map(mapAppointmentToRegistro)
}

export async function criarRegistro(
  payload: CriarRegistroAtendimentoInput,
): Promise<RegistroAtendimento> {
  const requestPayload = mapCriarRegistroToAppointment(payload)
  const response = await apiClient.post<BackendAppointment>('/appointments', requestPayload)
  return mapAppointmentToRegistro(response.data)
}
