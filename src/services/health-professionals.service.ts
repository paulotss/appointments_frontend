import { apiClient } from './apiClient'
import type { ListMeta, PagedList } from '../types/listEnvelope'
import type { CouncilType, CreateHealthProfessionalRequest, HealthProfessional, HealthProfessionalSpecialtyLink, UpdateHealthProfessionalRequest, WeeklyBlockInput } from '../types/profissional'
import type { UfBrasil } from '../utils/ufBrasil'
import type {
  ProfessionalSchedule,
  ScheduleException,
  ScheduleExceptionInput,
  ScheduleExceptionKind,
  ScheduleInterval,
} from '../types/bloqueioHorario'

const META_VAZIA: ListMeta = { page: 1, limit: 50, total: 0, totalPages: 1 }

export interface ListarProfissionaisParams {
  name?: string
  page?: number
  limit?: number
}

interface BackendSpecialtyRef {
  id: number
  name: string
}

interface BackendHealthProfessionalSpecialty {
  specialtyId: number
  specialty?: BackendSpecialtyRef
}

interface BackendWeeklyBlock {
  weekday: number
  startTime: string
  endTime: string
}

interface BackendHealthProfessional {
  id: number
  name: string
  councilType: CouncilType
  councilNumber: string
  councilUf?: string | null
  cbosCode?: string | null
  cpf: string
  phone?: string | null
  email?: string | null
  isActive: boolean
  specialties?: BackendHealthProfessionalSpecialty[]
  weeklyBlocks?: BackendWeeklyBlock[]
}

function mapSpecialtyLink(item: BackendHealthProfessionalSpecialty): HealthProfessionalSpecialtyLink {
  return {
    specialtyId: item.specialtyId,
    specialty: item.specialty,
  }
}

function mapWeeklyBlock(item: BackendWeeklyBlock): WeeklyBlockInput {
  return {
    weekday: item.weekday,
    startTime: item.startTime,
    endTime: item.endTime,
  }
}

function mapBackendHealthProfessional(item: BackendHealthProfessional): HealthProfessional {
  return {
    id: item.id,
    name: item.name,
    councilType: item.councilType,
    councilNumber: item.councilNumber,
    councilUf: (item.councilUf as UfBrasil | null) ?? null,
    cbosCode: item.cbosCode ?? null,
    cpf: item.cpf,
    phone: item.phone ?? null,
    email: item.email ?? null,
    isActive: item.isActive,
    specialties: (item.specialties ?? []).map(mapSpecialtyLink),
    weeklyBlocks: (item.weeklyBlocks ?? []).map(mapWeeklyBlock),
  }
}

export async function listarProfissionais(
  params?: ListarProfissionaisParams,
): Promise<PagedList<HealthProfessional>> {
  const name = params?.name?.trim()
  const response = await apiClient.get<PagedList<BackendHealthProfessional>>('/health-professionals', {
    params: {
      ...(name ? { name } : {}),
      ...(params?.page != null ? { page: params.page } : {}),
      ...(params?.limit != null ? { limit: params.limit } : {}),
    },
  })
  return {
    data: (response.data.data ?? []).map(mapBackendHealthProfessional),
    meta: response.data.meta ?? META_VAZIA,
  }
}

export async function buscarProfissional(id: number): Promise<HealthProfessional> {
  const response = await apiClient.get<BackendHealthProfessional>(`/health-professionals/${id}`)
  return mapBackendHealthProfessional(response.data)
}

export async function criarProfissional(
  payload: CreateHealthProfessionalRequest,
): Promise<HealthProfessional> {
  const response = await apiClient.post<BackendHealthProfessional>('/health-professionals', payload)
  return mapBackendHealthProfessional(response.data)
}

export async function atualizarProfissional(
  id: number,
  payload: UpdateHealthProfessionalRequest,
): Promise<HealthProfessional> {
  const response = await apiClient.patch<BackendHealthProfessional>(
    `/health-professionals/${id}`,
    payload,
  )
  return mapBackendHealthProfessional(response.data)
}

interface BackendScheduleDay {
  date: string
  weekday: number
  weeklyBlocks?: ScheduleInterval[]
  exceptions?: {
    kind: ScheduleExceptionKind
    startTime: string
    endTime: string
    note?: string | null
  }[]
  effectiveBlocks?: ScheduleInterval[]
}

function mapScheduleDay(day: BackendScheduleDay): ProfessionalSchedule['days'][number] {
  return {
    date: day.date,
    weekday: day.weekday,
    weeklyBlocks: day.weeklyBlocks ?? [],
    exceptions: (day.exceptions ?? []).map(
      (item): ScheduleException => ({
        kind: item.kind,
        startTime: item.startTime,
        endTime: item.endTime,
        note: item.note ?? null,
      }),
    ),
    effectiveBlocks: day.effectiveBlocks ?? [],
  }
}

export async function buscarAgendaProfissional(
  id: number,
  from: string,
  to: string,
): Promise<ProfessionalSchedule> {
  const response = await apiClient.get<{ days: BackendScheduleDay[] }>(
    `/health-professionals/${id}/schedule`,
    { params: { from, to } },
  )
  return { days: (response.data.days ?? []).map(mapScheduleDay) }
}

export async function substituirExcecoesAgenda(
  id: number,
  payload: { date: string; exceptions: ScheduleExceptionInput[] },
): Promise<ProfessionalSchedule> {
  const response = await apiClient.put<{ days: BackendScheduleDay[] }>(
    `/health-professionals/${id}/schedule-exceptions`,
    payload,
  )
  return { days: (response.data.days ?? []).map(mapScheduleDay) }
}
