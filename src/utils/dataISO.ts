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

export function formatarDataISO(value: string | null | undefined): string {
  const prefix = isoDatePrefix(value)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(prefix)) return value ?? '—'
  const [year, month, day] = prefix.split('-')
  return `${day}/${month}/${year}`
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
