import { adicionarDiasISO, isoDatePrefix } from './dataISO'

function diferencaDias(inicio: string, fim: string): number {
  const [anoInicio, mesInicio, diaInicio] = inicio.split('-').map(Number)
  const [anoFim, mesFim, diaFim] = fim.split('-').map(Number)
  const a = Date.UTC(anoInicio, mesInicio - 1, diaInicio)
  const b = Date.UTC(anoFim, mesFim - 1, diaFim)
  return Math.round((b - a) / 86_400_000)
}

/** Propõe N datas entre a autorização e hoje: semanal, ou 2x por semana se não couber. */
export function proporDatasSessoes(inicioISO: string, fimISO: string, quantidade: number): string[] {
  const inicio = isoDatePrefix(inicioISO)
  const fim = isoDatePrefix(fimISO)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(inicio) || !/^\d{4}-\d{2}-\d{2}$/.test(fim) || quantidade < 1) {
    return []
  }
  if (inicio > fim) return Array.from({ length: quantidade }, () => fim)
  if (quantidade === 1) return [inicio]

  const span = diferencaDias(inicio, fim)
  const gaps = quantidade - 1
  const step = gaps * 7 <= span ? 7 : gaps * 4 <= span ? 4 : gaps * 3 <= span ? 3 : null
  if (step != null) {
    return Array.from({ length: quantidade }, (_, index) =>
      adicionarDiasISO(fim, -step * (quantidade - 1 - index)),
    )
  }

  return Array.from({ length: quantidade }, (_, index) => {
    const offset = Math.round((index * span) / gaps)
    return adicionarDiasISO(inicio, offset)
  })
}

export function sessoesNoMesmoDia(dates: string[]): boolean {
  return new Set(dates).size !== dates.length
}
