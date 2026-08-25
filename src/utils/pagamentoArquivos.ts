import {
  PAYABLE_DOCUMENT_MAX_BYTES,
  PAYABLE_DOCUMENT_MAX_FILES,
  PAYABLE_DOCUMENT_MIME_TYPES,
} from '../types/financeiro'

export const ACCEPT_ARQUIVOS_PAGAMENTO = [
  ...PAYABLE_DOCUMENT_MIME_TYPES,
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
].join(',')

const EXTENSOES_PERMITIDAS = new Set(['.pdf', '.jpg', '.jpeg', '.png'])
const TIPOS_PERMITIDOS = new Set<string>([...PAYABLE_DOCUMENT_MIME_TYPES, 'image/jpg'])

function extensaoArquivo(nome: string): string {
  const indice = nome.lastIndexOf('.')
  return indice >= 0 ? nome.slice(indice).toLowerCase() : ''
}

export function arquivoPagamentoPermitido(file: File): boolean {
  if (TIPOS_PERMITIDOS.has(file.type.toLowerCase())) return true
  return EXTENSOES_PERMITIDAS.has(extensaoArquivo(file.name))
}

export function formatarTamanhoArquivo(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1).replace('.', ',')} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`
}

export function validarArquivosPagamento(
  atuais: File[],
  lista: FileList,
  ocupadosExistentes = 0,
): { aceitos: File[]; erro: string | null } {
  const restantes = PAYABLE_DOCUMENT_MAX_FILES - ocupadosExistentes - atuais.length
  if (restantes <= 0) {
    return {
      aceitos: [],
      erro: `Você pode anexar no máximo ${PAYABLE_DOCUMENT_MAX_FILES} arquivos.`,
    }
  }

  const aceitos: File[] = []
  const recusados: string[] = []

  for (const file of Array.from(lista)) {
    if (aceitos.length >= restantes) {
      recusados.push(`Limite de ${PAYABLE_DOCUMENT_MAX_FILES} arquivos.`)
      break
    }
    if (!arquivoPagamentoPermitido(file)) {
      recusados.push(`${file.name}: somente PDF, JPEG e PNG.`)
      continue
    }
    if (file.size > PAYABLE_DOCUMENT_MAX_BYTES) {
      recusados.push(`${file.name}: cada arquivo deve ter no máximo 1 MB.`)
      continue
    }
    aceitos.push(file)
  }

  return {
    aceitos,
    erro: recusados.length > 0 ? recusados.join(' ') : null,
  }
}
