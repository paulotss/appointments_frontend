import { clearToken, getToken, isAccessTokenExpired } from './authStorage'
import { apiClient } from './apiClient'

export type HigiaStatus = {
  available: boolean
}

export type HigiaAnswer = {
  answer: string
}

export type HigiaHistoryMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type HigiaStreamEvent =
  | { type: 'status'; message: string }
  | { type: 'delta'; text: string }
  | { type: 'done' }
  | { type: 'error'; message: string }

export class HigiaAuthRedirect extends Error {
  constructor() {
    super('Sessão expirada')
    this.name = 'HigiaAuthRedirect'
  }
}

export async function consultarStatusHigia(): Promise<HigiaStatus> {
  const response = await apiClient.get<HigiaStatus>('/higia/status', {
    timeout: 8_000,
  })
  return { available: Boolean(response.data?.available) }
}

export async function perguntarHigia(
  question: string,
  history: HigiaHistoryMessage[] = [],
): Promise<HigiaAnswer> {
  const response = await apiClient.post<HigiaAnswer>(
    '/higia/ask',
    { question, history },
    { timeout: 180_000 },
  )
  return {
    answer: response.data?.answer ?? '',
  }
}

export async function* perguntarHigiaStream(
  question: string,
  history: HigiaHistoryMessage[] = [],
  signal: AbortSignal,
): AsyncGenerator<HigiaStreamEvent> {
  const token = getToken()
  if (!token || isAccessTokenExpired(token)) {
    redirecionarParaLogin()
    throw new HigiaAuthRedirect()
  }

  const baseUrl = String(import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
  const response = await fetch(`${baseUrl}/higia/ask/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ question, history }),
    signal,
  })

  if (response.status === 401) {
    redirecionarParaLogin()
    throw new HigiaAuthRedirect()
  }

  if (!response.ok) {
    throw new Error(await mensagemResposta(response))
  }

  if (!response.body) {
    throw new Error('Higia model request failed')
  }

  yield* lerEventosSse(response.body, signal)
}

function redirecionarParaLogin(): void {
  clearToken()
  if (window.location.pathname !== '/login') {
    window.location.replace('/login')
  }
}

async function mensagemResposta(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { message?: string | string[] }
    if (typeof data.message === 'string' && data.message.trim()) {
      return data.message
    }
    if (Array.isArray(data.message) && data.message.length > 0) {
      return String(data.message[0])
    }
  } catch {
    return 'Higia model request failed'
  }
  return 'Higia model request failed'
}

async function* lerEventosSse(
  body: ReadableStream<Uint8Array>,
  signal: AbortSignal,
): AsyncGenerator<HigiaStreamEvent> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (!signal.aborted) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n')
      const blocks = buffer.split('\n\n')
      buffer = blocks.pop() ?? ''
      for (const block of blocks) {
        const event = parseSseBlock(block)
        if (event) {
          yield event
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  if (signal.aborted) {
    return
  }

  const tail = buffer.replace(/\r\n/g, '\n').trim()
  if (!tail) {
    return
  }
  const event = parseSseBlock(tail)
  if (event) {
    yield event
  }
}

function parseSseBlock(block: string): HigiaStreamEvent | null {
  const dataLines: string[] = []
  for (const line of block.split('\n')) {
    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trim())
    }
  }
  if (dataLines.length === 0) {
    return null
  }

  try {
    const parsed: unknown = JSON.parse(dataLines.join('\n'))
    return isHigiaStreamEvent(parsed) ? parsed : null
  } catch {
    return null
  }
}

function isHigiaStreamEvent(value: unknown): value is HigiaStreamEvent {
  if (!value || typeof value !== 'object' || !('type' in value)) {
    return false
  }
  const event = value as HigiaStreamEvent
  if (event.type === 'status') {
    return typeof event.message === 'string'
  }
  if (event.type === 'delta') {
    return typeof event.text === 'string'
  }
  if (event.type === 'done') {
    return true
  }
  if (event.type === 'error') {
    return typeof event.message === 'string'
  }
  return false
}
