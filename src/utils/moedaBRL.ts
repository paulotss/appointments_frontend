const formatadorMoeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function parseValorDecimal(value: string | number | null | undefined): number {
  if (value == null || value === '') return Number.NaN
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : Number.NaN
}

export function formatarMoedaBRL(value: string | number | null | undefined): string {
  const n = parseValorDecimal(value)
  if (Number.isNaN(n)) return ''
  return formatadorMoeda.format(n)
}

export function numeroParaDigitosMoedaBRL(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return ''
  return Math.round(value * 100).toString()
}

export function digitosParaNumeroMoedaBRL(digitos: string): number | undefined {
  if (digitos === '') return undefined
  return Number(digitos) / 100
}

export function normalizarDigitosMoedaBRL(digitosAnteriores: string, entrada: string): string {
  const apenasDigitos = entrada.replace(/\D/g, '')
  if (apenasDigitos === '') return ''

  if (apenasDigitos.length <= digitosAnteriores.length) {
    return apenasDigitos
  }

  if (
    apenasDigitos.length === digitosAnteriores.length + 1 &&
    apenasDigitos.startsWith(digitosAnteriores)
  ) {
    return apenasDigitos
  }

  return apenasDigitos.slice(-(digitosAnteriores.length + 1))
}
