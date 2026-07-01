const formatadorMoeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function formatarMoedaBRL(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return ''
  return formatadorMoeda.format(value)
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
