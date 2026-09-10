import {
  GUIDE_DOCUMENT_MAX_BYTES,
  GUIDE_DOCUMENT_MAX_FILES,
  GUIDE_DOCUMENT_MIME_TYPES,
} from '../types/guia'

export const ACCEPT_ARQUIVOS_GUIA = [
  ...GUIDE_DOCUMENT_MIME_TYPES,
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
].join(',')

const EXTENSOES_PERMITIDAS = new Set(['.pdf', '.jpg', '.jpeg', '.png'])
const TIPOS_PERMITIDOS = new Set<string>([...GUIDE_DOCUMENT_MIME_TYPES, 'image/jpg'])

function extensaoArquivo(nome: string): string {
  const indice = nome.lastIndexOf('.')
  return indice >= 0 ? nome.slice(indice).toLowerCase() : ''
}

export function arquivoGuiaPermitido(file: File): boolean {
  if (TIPOS_PERMITIDOS.has(file.type.toLowerCase())) return true
  return EXTENSOES_PERMITIDAS.has(extensaoArquivo(file.name))
}

export function validarArquivosGuia(
  atuais: File[],
  lista: FileList,
  ocupadosExistentes = 0,
): { aceitos: File[]; erro: string | null } {
  const restantes = GUIDE_DOCUMENT_MAX_FILES - ocupadosExistentes - atuais.length
  if (restantes <= 0) {
    return {
      aceitos: [],
      erro: `Você pode anexar no máximo ${GUIDE_DOCUMENT_MAX_FILES} arquivos.`,
    }
  }

  const aceitos: File[] = []
  const recusados: string[] = []

  for (const file of Array.from(lista)) {
    if (aceitos.length >= restantes) {
      recusados.push(`Limite de ${GUIDE_DOCUMENT_MAX_FILES} arquivos.`)
      break
    }
    if (!arquivoGuiaPermitido(file)) {
      recusados.push(`${file.name}: somente PDF, JPEG e PNG.`)
      continue
    }
    if (file.size > GUIDE_DOCUMENT_MAX_BYTES) {
      recusados.push(`${file.name}: cada arquivo deve ter no máximo 10 MB.`)
      continue
    }
    aceitos.push(file)
  }

  return {
    aceitos,
    erro: recusados.length > 0 ? recusados.join(' ') : null,
  }
}
