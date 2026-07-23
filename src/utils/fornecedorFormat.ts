export function apenasDigitos(value: string): string {
  return value.replace(/\D/g, '')
}

export function formatarCnpj(value: string | null | undefined): string {
  const digitos = apenasDigitos(value ?? '')
  if (digitos.length !== 14) return value?.trim() || '-'

  return digitos.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

export function formatarTelefone(value: string | null | undefined): string {
  const digitos = apenasDigitos(value ?? '')
  if (digitos.length === 10) {
    return digitos.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3')
  }
  if (digitos.length === 11) {
    return digitos.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
  }
  return value?.trim() || '-'
}
