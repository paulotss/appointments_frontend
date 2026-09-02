/** Extrai YYYY-MM-DD de ISO UTC sem converter fuso (evita voltar um dia em America/Sao_Paulo). */
export function isoDatePrefix(value: string | null | undefined): string {
  if (!value) return ''
  return value.slice(0, 10)
}

function formatarDateLocal(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function adicionarDiasISO(dataISO: string, dias: number): string {
  const prefix = isoDatePrefix(dataISO)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(prefix)) return ''
  const [year, month, day] = prefix.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + dias)
  return formatarDateLocal(date)
}

export function hojeLocalISO(): string {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return formatarDateLocal(date)
}

export function primeiroDiaDoMesLocalISO(ref = hojeLocalISO()): string {
  const prefix = isoDatePrefix(ref)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(prefix)) return prefix
  return `${prefix.slice(0, 7)}-01`
}

export function hojeMaisDiasLocal(dias: number): string {
  return adicionarDiasISO(hojeLocalISO(), dias)
}

export function isoParaDataBR(value: string | null | undefined): string {
  const prefix = isoDatePrefix(value)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(prefix)) return ''
  const [year, month, day] = prefix.split('-')
  return `${day}/${month}/${year}`
}

export function mascararDataBR(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

export function dataBRParaIso(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim())
  if (!match) return null
  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null
  }
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function isoDateTimeLocalParaBr(value: string | null | undefined): string {
  if (!value) return ''
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value)
  if (!match) return isoParaDataBR(value)
  return `${match[3]}/${match[2]}/${match[1]} ${match[4]}:${match[5]}`
}

export function mascararDataHoraBR(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 12)
  const data = mascararDataBR(digits.slice(0, 8))
  const hora = digits.slice(8)
  if (!hora) return data
  if (hora.length <= 2) return `${data} ${hora}`
  return `${data} ${hora.slice(0, 2)}:${hora.slice(2, 4)}`
}

export function dataHoraBRParaIsoLocal(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?$/.exec(value.trim())
  if (!match) return null
  const isoDate = dataBRParaIso(`${match[1]}/${match[2]}/${match[3]}`)
  if (!isoDate) return null
  const hour = match[4] ?? '00'
  const minute = match[5] ?? '00'
  const h = Number(hour)
  const min = Number(minute)
  if (h > 23 || min > 59) return null
  return `${isoDate}T${hour}:${minute}`
}

export function formatarDataISO(value: string | null | undefined): string {
  const formatado = isoParaDataBR(value)
  if (formatado) return formatado
  return value ?? '—'
}

export function formatarDataHoraISO(value: string | null | undefined): string {
  if (!value) return '—'
  const data = new Date(value)
  if (Number.isNaN(data.getTime())) return value
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(data)
}

/** Diferenca em dias civis (local): positivo = futuro, 0 = hoje, negativo = atrasado. */
export function diasAteDataISO(value: string | null | undefined): number | null {
  const prefix = isoDatePrefix(value)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(prefix)) return null
  const [year, month, day] = prefix.split('-').map(Number)
  const [hojeYear, hojeMonth, hojeDay] = hojeLocalISO().split('-').map(Number)
  const alvo = Date.UTC(year, month - 1, day)
  const hoje = Date.UTC(hojeYear, hojeMonth - 1, hojeDay)
  return Math.round((alvo - hoje) / (24 * 60 * 60 * 1000))
}

export type StatusPrazoGuia = 'ok' | 'proxima' | 'ultimoDia' | 'vencida'

export function statusPrazoGuia(expirationDate: string): StatusPrazoGuia {
  const dias = diasAteDataISO(expirationDate)
  if (dias == null) return 'ok'
  if (dias < 0) return 'vencida'
  if (dias === 0) return 'ultimoDia'
  if (dias <= 7) return 'proxima'
  return 'ok'
}
