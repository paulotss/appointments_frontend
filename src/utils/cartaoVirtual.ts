import fundoUrl from '../assets/cartao-virtual-bg.png'
import { isoParaDataBR } from './dataISO'

const LARGURA = 360
const ALTURA = 231
const ESQUERDA = 80
const LARGURA_TEXTO = LARGURA - ESQUERDA - 16
const ALTURA_BLOCO = 36

export interface CartaoVirtualDados {
  nome: string
  cpf: string | null
  cardNumber: string
  expiresAt: string
}

function carregarFundo(): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const imagem = new Image()
    const falhou = () => reject(new Error('Não foi possível carregar o fundo do cartão.'))
    const timer = window.setTimeout(falhou, 8000)
    imagem.onload = () => {
      window.clearTimeout(timer)
      resolve(imagem)
    }
    imagem.onerror = () => {
      window.clearTimeout(timer)
      falhou()
    }
    imagem.src = fundoUrl
  })
}

export function formatarDocumentoCartao(cpf: string | null | undefined): string {
  if (!cpf) return '—'
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return cpf
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

export function nomeArquivoCartao(cardNumber: string, nome: string): string {
  const slug = nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `cartao-${cardNumber}-${slug || 'beneficiario'}.jpg`
}

function textoLimitado(ctx: CanvasRenderingContext2D, texto: string, maximo: number): string {
  if (ctx.measureText(texto).width <= maximo) return texto
  const reticencias = '…'
  let corte = texto
  while (corte.length > 0 && ctx.measureText(`${corte}${reticencias}`).width > maximo) {
    corte = corte.slice(0, -1)
  }
  return `${corte}${reticencias}`
}

function desenharCampo(
  ctx: CanvasRenderingContext2D,
  rotulo: string,
  valor: string,
  topo: number,
): void {
  ctx.fillStyle = '#ffffff'
  ctx.textBaseline = 'top'
  ctx.font = '12px Roboto, sans-serif'
  ctx.fillText(textoLimitado(ctx, rotulo, LARGURA_TEXTO), ESQUERDA, topo)
  ctx.font = 'bold 14px Roboto, sans-serif'
  ctx.fillText(textoLimitado(ctx, valor, LARGURA_TEXTO), ESQUERDA, topo + 16)
}

export async function desenharCartaoVirtual(
  canvas: HTMLCanvasElement,
  dados: CartaoVirtualDados,
): Promise<void> {
  const fundo = await carregarFundo()
  canvas.width = LARGURA
  canvas.height = ALTURA
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Não foi possível desenhar o cartão.')
  ctx.fillStyle = '#0b3a3a'
  ctx.fillRect(0, 0, LARGURA, ALTURA)
  ctx.drawImage(fundo, 0, 0, LARGURA, ALTURA)
  desenharCampo(ctx, 'Nome do beneficiário', dados.nome || '—', 40)
  desenharCampo(ctx, 'Número de inscrição', dados.cardNumber || '—', 88)
  desenharCampo(
    ctx,
    'Documento do beneficiário',
    formatarDocumentoCartao(dados.cpf),
    ALTURA - 63 - ALTURA_BLOCO,
  )
  desenharCampo(
    ctx,
    'Válido até',
    isoParaDataBR(dados.expiresAt) || '—',
    ALTURA - 20 - ALTURA_BLOCO,
  )
}

export function copiarCartao(destino: HTMLCanvasElement, origem: HTMLCanvasElement): void {
  destino.width = origem.width
  destino.height = origem.height
  const ctx = destino.getContext('2d')
  if (!ctx) throw new Error('Não foi possível desenhar o cartão.')
  ctx.drawImage(origem, 0, 0)
}

export function baixarCanvasJpeg(canvas: HTMLCanvasElement, nomeArquivo: string): Promise<void> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Não foi possível gerar o JPEG.'))
          return
        }
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.download = nomeArquivo
        link.href = url
        link.click()
        URL.revokeObjectURL(url)
        resolve()
      },
      'image/jpeg',
      0.95,
    )
  })
}
