import AddIcon from '@mui/icons-material/Add'
import SendIcon from '@mui/icons-material/Send'
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import { TOP_BAR_HEIGHT } from '../layouts/AppLayout'
import {
  consultarStatusHigia,
  HigiaAuthRedirect,
  perguntarHigiaStream,
  type HigiaHistoryMessage,
} from '../services/higia.service'
import { traduzirMensagemErro } from '../utils/apiError'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

const SCROLL_STICK_THRESHOLD = 80

export function HigiaPage() {
  const [available, setAvailable] = useState<boolean | null>(null)
  const [question, setQuestion] = useState('')
  const [sending, setSending] = useState(false)
  const [consulting, setConsulting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const historyRef = useRef<HTMLDivElement | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const generationRef = useRef(0)
  const stickToBottomRef = useRef(true)

  useEffect(() => {
    let active = true
    consultarStatusHigia()
      .then((status) => {
        if (active) {
          setAvailable(status.available)
        }
      })
      .catch(() => {
        if (active) {
          setAvailable(false)
        }
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  useLayoutEffect(() => {
    if (!stickToBottomRef.current) {
      return
    }
    const node = historyRef.current
    if (node) {
      node.scrollTop = node.scrollHeight
    }
  }, [messages, consulting, sending])

  function handleHistoryScroll() {
    const node = historyRef.current
    if (!node) {
      return
    }
    const distance = node.scrollHeight - node.scrollTop - node.clientHeight
    stickToBottomRef.current = distance < SCROLL_STICK_THRESHOLD
  }

  function handleNewConversation() {
    abortRef.current?.abort()
    abortRef.current = null
    generationRef.current += 1
    stickToBottomRef.current = true
    setMessages([])
    setQuestion('')
    setError(null)
    setSending(false)
    setConsulting(false)
  }

  async function handleSubmit(event?: FormEvent) {
    event?.preventDefault()
    const trimmed = question.trim()
    if (!trimmed || sending) {
      return
    }

    const history: HigiaHistoryMessage[] = messages
      .filter((item) => item.content.trim())
      .map((item) => ({ role: item.role, content: item.content }))

    const generation = generationRef.current
    const controller = new AbortController()
    abortRef.current = controller
    stickToBottomRef.current = true
    setSending(true)
    setConsulting(true)
    setError(null)
    setQuestion('')
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: trimmed },
      { role: 'assistant', content: '' },
    ])

    let completed = false
    try {
      for await (const streamEvent of perguntarHigiaStream(trimmed, history, controller.signal)) {
        if (generationRef.current !== generation) {
          return
        }
        if (streamEvent.type === 'status') {
          setConsulting(true)
          continue
        }
        if (streamEvent.type === 'delta') {
          setConsulting(false)
          setMessages((prev) => appendAssistantDelta(prev, streamEvent.text))
          continue
        }
        if (streamEvent.type === 'error') {
          completed = true
          setConsulting(false)
          setError(
            traduzirMensagemErro(streamEvent.message, 'Não foi possível obter a resposta.'),
          )
          setMessages((prev) => dropEmptyAssistant(prev))
          continue
        }
        completed = true
        setConsulting(false)
      }

      if (!completed && generationRef.current === generation && !controller.signal.aborted) {
        setError('A Higia não retornou uma resposta utilizável.')
        setMessages((prev) => dropEmptyAssistant(prev))
      }
    } catch (err) {
      if (controller.signal.aborted || generationRef.current !== generation) {
        return
      }
      if (err instanceof HigiaAuthRedirect) {
        return
      }
      setError(mensagemFalha(err))
      setMessages((prev) => dropEmptyAssistant(prev))
    } finally {
      if (generationRef.current === generation) {
        setSending(false)
        setConsulting(false)
      }
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void handleSubmit()
    }
  }

  const showEmpty = available && messages.length === 0 && !sending

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: `calc(100vh - ${TOP_BAR_HEIGHT}px)`,
        m: -3,
        minHeight: 0,
        overflow: 'hidden',
        bgcolor: 'grey.100',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          flexShrink: 0,
          px: 3,
          py: 1.5,
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6" component="h1">
          Higia
        </Typography>
        {available ? (
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleNewConversation}
          >
            Nova conversa
          </Button>
        ) : null}
      </Stack>

      <Box
        ref={historyRef}
        onScroll={handleHistoryScroll}
        sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}
      >
        {available === null ? (
          <Stack alignItems="center" justifyContent="center" sx={{ height: '100%' }}>
            <CircularProgress size={28} />
          </Stack>
        ) : null}

        {available === false ? (
          <Stack alignItems="center" justifyContent="center" sx={{ height: '100%', p: 3 }}>
            <Typography>Indisponível</Typography>
          </Stack>
        ) : null}

        {showEmpty ? (
          <Stack alignItems="center" justifyContent="center" sx={{ height: '100%', p: 3 }}>
            <Typography color="text.secondary" textAlign="center">
              Pergunte sobre agenda, pacientes, convênios, financeiro e estoque.
            </Typography>
          </Stack>
        ) : null}

        {available && messages.length > 0 ? (
          <Stack spacing={1.5} sx={{ p: 3 }}>
            {messages.map((item, index) => {
              const isUser = item.role === 'user'
              const isPendingAssistant =
                !isUser && !item.content && consulting && index === messages.length - 1
              if (!isUser && !item.content && !isPendingAssistant) {
                return null
              }
              return (
                <Box
                  key={`${item.role}-${index}`}
                  sx={{
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: 'min(720px, 90%)',
                    bgcolor: isUser ? 'primary.light' : 'background.paper',
                    color: isUser ? 'primary.dark' : 'text.primary',
                    px: 1.5,
                    py: 1,
                    borderRadius: 2,
                    boxShadow: 1,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {isPendingAssistant ? (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CircularProgress size={16} />
                      <Typography variant="body2" color="text.secondary">
                        Consultando...
                      </Typography>
                    </Stack>
                  ) : (
                    <Typography variant="body2">{item.content}</Typography>
                  )}
                </Box>
              )
            })}
          </Stack>
        ) : null}
      </Box>

      {error ? (
        <Typography color="error" variant="body2" sx={{ px: 3, py: 1, flexShrink: 0 }}>
          {error}
        </Typography>
      ) : null}

      {available ? (
        <Box
          component="form"
          onSubmit={(event) => void handleSubmit(event)}
          sx={{
            flexShrink: 0,
            display: 'flex',
            gap: 1,
            alignItems: 'flex-end',
            px: 3,
            py: 2,
            bgcolor: 'background.paper',
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          <TextField
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escreva sua pergunta"
            fullWidth
            multiline
            minRows={2}
            maxRows={6}
            disabled={sending}
            inputProps={{ maxLength: 2000 }}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={sending || !question.trim()}
            endIcon={<SendIcon />}
            sx={{ flexShrink: 0, height: 40 }}
          >
            Enviar
          </Button>
        </Box>
      ) : null}
    </Box>
  )
}

function appendAssistantDelta(messages: ChatMessage[], text: string): ChatMessage[] {
  const next = [...messages]
  const last = next[next.length - 1]
  if (last?.role !== 'assistant') {
    next.push({ role: 'assistant', content: text })
    return next
  }
  next[next.length - 1] = { ...last, content: last.content + text }
  return next
}

function dropEmptyAssistant(messages: ChatMessage[]): ChatMessage[] {
  const last = messages[messages.length - 1]
  if (last?.role === 'assistant' && !last.content.trim()) {
    return messages.slice(0, -1)
  }
  return messages
}

function mensagemFalha(error: unknown): string {
  if (error instanceof TypeError) {
    return 'Não foi possível conectar ao servidor.'
  }
  const raw = error instanceof Error ? error.message : ''
  return traduzirMensagemErro(raw, 'Não foi possível obter a resposta.')
}
