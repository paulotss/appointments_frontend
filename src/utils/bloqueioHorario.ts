export type IntervaloMinutos = {
  startMinute: number
  endMinute: number
}

export type IntervaloHorario = {
  startTime: string
  endTime: string
}

export const DIAS_SEMANA_BLOQUEIO = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
] as const

export function horarioParaMinuto(value: string, permite24 = false): number | null {
  if (permite24 && value === '24:00') return 1440
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

export function minutoParaHorario(minute: number): string {
  if (minute === 1440) return '24:00'
  const hour = Math.floor(minute / 60)
  const rest = minute % 60
  return `${String(hour).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
}

export function unirIntervalos(intervals: IntervaloMinutos[]): IntervaloMinutos[] {
  const sorted = intervals
    .filter((item) => item.endMinute > item.startMinute)
    .sort((a, b) => a.startMinute - b.startMinute || a.endMinute - b.endMinute)
  const result: IntervaloMinutos[] = []
  for (const item of sorted) {
    const last = result[result.length - 1]
    if (!last || item.startMinute > last.endMinute) {
      result.push({ startMinute: item.startMinute, endMinute: item.endMinute })
    } else {
      last.endMinute = Math.max(last.endMinute, item.endMinute)
    }
  }
  return result
}

export function subtrairIntervalos(
  base: IntervaloMinutos[],
  cortes: IntervaloMinutos[],
): IntervaloMinutos[] {
  let atual = unirIntervalos(base)
  for (const corte of unirIntervalos(cortes)) {
    const next: IntervaloMinutos[] = []
    for (const item of atual) {
      if (corte.endMinute <= item.startMinute || corte.startMinute >= item.endMinute) {
        next.push(item)
        continue
      }
      if (corte.startMinute > item.startMinute) {
        next.push({ startMinute: item.startMinute, endMinute: corte.startMinute })
      }
      if (corte.endMinute < item.endMinute) {
        next.push({ startMinute: corte.endMinute, endMinute: item.endMinute })
      }
    }
    atual = next
  }
  return atual
}

export function resolverBloqueiosEfetivos(params: {
  semanais: IntervaloMinutos[]
  liberacoes: IntervaloMinutos[]
  bloqueios: IntervaloMinutos[]
}): IntervaloMinutos[] {
  const aposLiberacao = subtrairIntervalos(params.semanais, params.liberacoes)
  return unirIntervalos([...aposLiberacao, ...params.bloqueios])
}

export function intervalosSobrepostos(intervals: IntervaloMinutos[]): boolean {
  const sorted = [...intervals].sort(
    (a, b) => a.startMinute - b.startMinute || a.endMinute - b.endMinute,
  )
  for (let index = 1; index < sorted.length; index += 1) {
    if (sorted[index].startMinute < sorted[index - 1].endMinute) return true
  }
  return false
}

export function paraIntervalo(item: IntervaloHorario): IntervaloMinutos | null {
  const startMinute = horarioParaMinuto(item.startTime)
  const endMinute = horarioParaMinuto(item.endTime, true)
  if (startMinute == null || endMinute == null || endMinute <= startMinute) return null
  return { startMinute, endMinute }
}

export function slotCruzaBloqueio(
  inicioMinuto: number,
  duracaoMinutos: number,
  blocos: IntervaloHorario[],
): boolean {
  const fim = inicioMinuto + duracaoMinutos
  return blocos.some((bloco) => {
    const intervalo = paraIntervalo(bloco)
    if (!intervalo) return false
    return inicioMinuto < intervalo.endMinute && fim > intervalo.startMinute
  })
}
