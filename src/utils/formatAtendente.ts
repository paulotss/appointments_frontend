/** Texto exibido para atendente na lista de registros (nome e ramal). */
export function formatAtendenteExibicao(nome: string, extension?: number | null): string {
  const trimmed = nome.trim()
  if (extension != null && Number.isInteger(extension)) {
    return `${trimmed} | ${extension}`
  }
  return trimmed
}
