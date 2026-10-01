export type ScheduleExceptionKind = 'block' | 'release'

export interface ScheduleInterval {
  startTime: string
  endTime: string
}

export interface ScheduleException {
  kind: ScheduleExceptionKind
  startTime: string
  endTime: string
  note: string | null
}

export interface ScheduleExceptionInput {
  kind: ScheduleExceptionKind
  startTime: string
  endTime: string
  note?: string | null
}

export interface ProfessionalScheduleDay {
  date: string
  weekday: number
  weeklyBlocks: ScheduleInterval[]
  exceptions: ScheduleException[]
  effectiveBlocks: ScheduleInterval[]
}

export interface ProfessionalSchedule {
  days: ProfessionalScheduleDay[]
}
