const TIMEZONE = 'America/Sao_Paulo'

const MESES_PT = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
] as const

export type PartesDataHora = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

function parseYmd(value: string): { year: number; month: number; day: number } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  return { year, month, day }
}

export function formatarYmd(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function partesEmSaoPaulo(date: Date): PartesDataHora {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((item) => item.type === type)?.value ?? 0)

  let hour = get('hour')
  if (hour === 24) hour = 0

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour,
    minute: get('minute'),
    second: get('second'),
  }
}

export function ymdEmSaoPaulo(date: Date = new Date()): string {
  const p = partesEmSaoPaulo(date)
  return formatarYmd(p.year, p.month, p.day)
}

export function isoParaYmdSaoPaulo(iso: string): string {
  return ymdEmSaoPaulo(new Date(iso))
}

export function isoParaHmSaoPaulo(iso: string): string {
  const p = partesEmSaoPaulo(new Date(iso))
  return `${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`
}

export function formatarHoraSaoPaulo(iso: string): string {
  return isoParaHmSaoPaulo(iso)
}

export function formatarDataHoraSaoPaulo(iso: string): string {
  const p = partesEmSaoPaulo(new Date(iso))
  return `${String(p.day).padStart(2, '0')}/${String(p.month).padStart(2, '0')}/${p.year} ${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`
}

/** Converte data+hora de parede em America/Sao_Paulo para ISO 8601 UTC. */
export function dataHoraSaoPauloParaIso(ymd: string, hm: string): string {
  const parsed = parseYmd(ymd)
  if (!parsed || !/^\d{2}:\d{2}$/.test(hm)) return ''
  const [hour, minute] = hm.split(':').map(Number)
  const desiredUtcMs = Date.UTC(parsed.year, parsed.month - 1, parsed.day, hour, minute, 0)

  function offsetMs(instant: number): number {
    const p = partesEmSaoPaulo(new Date(instant))
    const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
    return asUtc - instant
  }

  let utc = desiredUtcMs - offsetMs(desiredUtcMs)
  utc = desiredUtcMs - offsetMs(utc)
  return new Date(utc).toISOString()
}

export function adicionarDiasYmd(ymd: string, dias: number): string {
  const parsed = parseYmd(ymd)
  if (!parsed) return ''
  const date = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day))
  date.setUTCDate(date.getUTCDate() + dias)
  return formatarYmd(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate())
}

/** Segunda-feira da semana ISO (semana começa na segunda). */
export function segundaDaSemana(ymd: string): string {
  const parsed = parseYmd(ymd)
  if (!parsed) return ymd
  const date = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day))
  const weekday = date.getUTCDay() // 0 domingo
  const diff = weekday === 0 ? -6 : 1 - weekday
  date.setUTCDate(date.getUTCDate() + diff)
  return formatarYmd(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate())
}

export function domingoDaSemana(ymd: string): string {
  return adicionarDiasYmd(segundaDaSemana(ymd), 6)
}

export function primeiroDiaDoMes(ymd: string): string {
  const parsed = parseYmd(ymd)
  if (!parsed) return ymd
  return formatarYmd(parsed.year, parsed.month, 1)
}

export function ultimoDiaDoMes(ymd: string): string {
  const parsed = parseYmd(ymd)
  if (!parsed) return ymd
  const date = new Date(Date.UTC(parsed.year, parsed.month, 0))
  return formatarYmd(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate())
}

/** Grade do mês (6 semanas), começando na segunda-feira. */
export function gradeDoMes(ymd: string): string[] {
  const inicioMes = primeiroDiaDoMes(ymd)
  const inicioGrade = segundaDaSemana(inicioMes)
  return Array.from({ length: 42 }, (_, i) => adicionarDiasYmd(inicioGrade, i))
}

export function diasDaSemana(ymd: string): string[] {
  const segunda = segundaDaSemana(ymd)
  return Array.from({ length: 7 }, (_, i) => adicionarDiasYmd(segunda, i))
}

export function tituloDiaPt(ymd: string): string {
  const parsed = parseYmd(ymd)
  if (!parsed) return ymd
  return `${parsed.day} de ${MESES_PT[parsed.month - 1]} de ${parsed.year}`
}

export function tituloSemanaPt(from: string, to: string): string {
  const a = parseYmd(from)
  const b = parseYmd(to)
  if (!a || !b) return `${from} – ${to}`
  if (a.year === b.year && a.month === b.month) {
    return `${a.day} – ${b.day} de ${MESES_PT[a.month - 1]} de ${a.year}`
  }
  if (a.year === b.year) {
    return `${a.day} de ${MESES_PT[a.month - 1]} – ${b.day} de ${MESES_PT[b.month - 1]} de ${a.year}`
  }
  return `${a.day} de ${MESES_PT[a.month - 1]} de ${a.year} – ${b.day} de ${MESES_PT[b.month - 1]} de ${b.year}`
}

export function tituloMesPt(ymd: string): string {
  const parsed = parseYmd(ymd)
  if (!parsed) return ymd
  return `${MESES_PT[parsed.month - 1]} de ${parsed.year}`
}

export function mesmoMes(a: string, b: string): boolean {
  return a.slice(0, 7) === b.slice(0, 7)
}

export const DIAS_SEMANA_CURTOS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'] as const

/** 0 = segunda ... 6 = domingo */
export function indiceSemanaSegunda(ymd: string): number {
  const parsed = parseYmd(ymd)
  if (!parsed) return 0
  const date = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day))
  const weekday = date.getUTCDay()
  return weekday === 0 ? 6 : weekday - 1
}
