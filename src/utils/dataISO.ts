/** Extrai YYYY-MM-DD de ISO UTC sem converter fuso (evita voltar um dia em America/Sao_Paulo). */
export function isoDatePrefix(value: string | null | undefined): string {
  if (!value) return ''
  return value.slice(0, 10)
}

export function hojeMaisDiasLocal(dias: number): string {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + dias)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatarDataISO(value: string | null | undefined): string {
  const prefix = isoDatePrefix(value)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(prefix)) return value ?? '—'
  const [year, month, day] = prefix.split('-')
  return `${day}/${month}/${year}`
}

export function hojeLocalISO(): string {
  return hojeMaisDiasLocal(0)
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

export type StatusPrazoGuia = 'ok' | 'proxima' | 'vencida'

export function statusPrazoGuia(expirationDate: string): StatusPrazoGuia {
  const dias = diasAteDataISO(expirationDate)
  if (dias == null) return 'ok'
  if (dias <= 0) return 'vencida'
  if (dias <= 7) return 'proxima'
  return 'ok'
}
