import ChatIcon from '@mui/icons-material/Chat'
import CloseIcon from '@mui/icons-material/Close'
import SendIcon from '@mui/icons-material/Send'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Fab,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { consultarStatusPortalRag, perguntarPortalRag } from '../services/portal-rag.service'
import { mensagemErroApi } from '../utils/apiError'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
}

type DialogMode = 'unavailable' | 'chat'

export function PortalRagChat() {
  const [checking, setChecking] = useState(false)
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<DialogMode>('unavailable')
  const [question, setQuestion] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const historyRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open || mode !== 'chat') {
      return
    }
    const node = historyRef.current
    if (node) {
      node.scrollTop = node.scrollHeight
    }
  }, [messages, open, mode, sending])

  async function handleOpen() {
    if (checking) {
      return
    }
    setChecking(true)
    setError(null)
    try {
      const status = await consultarStatusPortalRag()
      setMode(status.available ? 'chat' : 'unavailable')
    } catch {
      setMode('unavailable')
    } finally {
      setChecking(false)
      setOpen(true)
    }
  }

  function handleClose() {
    if (sending) {
      return
    }
    setOpen(false)
    setError(null)
  }

  async function handleSubmit(event?: FormEvent) {
    event?.preventDefault()
    const trimmed = question.trim()
    if (!trimmed || sending) {
      return
    }

    setSending(true)
    setError(null)
    setQuestion('')
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }])

    try {
      const result = await perguntarPortalRag(trimmed)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: result.answer, sources: result.sources },
      ])
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível obter a resposta.'))
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void handleSubmit()
    }
  }

  return (
    <>
      <Fab
        color="primary"
        aria-label="Abrir assistente interno"
        onClick={() => void handleOpen()}
        disabled={checking}
        sx={{
          position: 'fixed',
          right: { xs: 16, sm: 24 },
          bottom: { xs: 16, sm: 24 },
          zIndex: 1200,
        }}
      >
        {checking ? <CircularProgress size={24} color="inherit" /> : <ChatIcon />}
      </Fab>

      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
        aria-labelledby="portal-rag-title"
      >
        {mode === 'unavailable' ? (
          <>
            <DialogTitle id="portal-rag-title" sx={{ pr: 6, position: 'relative' }}>
              Assistente AMHP
              <IconButton
                aria-label="Fechar"
                onClick={handleClose}
                sx={{ position: 'absolute', right: 8, top: 8 }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Typography>Indisponível</Typography>
            </DialogContent>
          </>
        ) : (
          <>
            <DialogTitle id="portal-rag-title" sx={{ pr: 6, position: 'relative' }}>
              Assistente AMHP
              <IconButton
                aria-label="Fechar"
                onClick={handleClose}
                disabled={sending}
                sx={{ position: 'absolute', right: 8, top: 8 }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Box
                ref={historyRef}
                sx={{
                  minHeight: 220,
                  maxHeight: 360,
                  overflowY: 'auto',
                  bgcolor: 'grey.50',
                  borderRadius: 1,
                  p: 1.5,
                }}
              >
                {messages.length === 0 && !sending ? (
                  <Typography color="text.secondary">
                    Pergunte sobre prazos, convênios e regras do portal.
                  </Typography>
                ) : (
                  <Stack spacing={1.5}>
                    {messages.map((item, index) => (
                      <Box
                        key={`${item.role}-${index}`}
                        sx={{
                          alignSelf: item.role === 'user' ? 'flex-end' : 'flex-start',
                          maxWidth: '90%',
                          bgcolor: item.role === 'user' ? 'primary.light' : 'background.paper',
                          color: item.role === 'user' ? 'primary.dark' : 'text.primary',
                          px: 1.5,
                          py: 1,
                          borderRadius: 2,
                          boxShadow: 1,
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        <Typography variant="body2">{item.content}</Typography>
                        {item.sources && item.sources.length > 0 ? (
                          <Stack spacing={0.5} sx={{ mt: 1 }}>
                            {item.sources.map((source) => (
                              <Typography
                                key={source}
                                component="a"
                                href={source}
                                target="_blank"
                                rel="noreferrer"
                                variant="caption"
                                sx={{ color: 'primary.dark', wordBreak: 'break-all' }}
                              >
                                {source}
                              </Typography>
                            ))}
                          </Stack>
                        ) : null}
                      </Box>
                    ))}
                    {sending ? (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <CircularProgress size={16} />
                        <Typography variant="body2" color="text.secondary">
                          Consultando...
                        </Typography>
                      </Stack>
                    ) : null}
                  </Stack>
                )}
              </Box>

              {error ? (
                <Typography color="error" variant="body2">
                  {error}
                </Typography>
              ) : null}

              <Box
                component="form"
                onSubmit={(event) => void handleSubmit(event)}
                sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}
              >
                <TextField
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escreva sua pergunta"
                  fullWidth
                  multiline
                  minRows={2}
                  maxRows={4}
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
            </DialogContent>
          </>
        )}
      </Dialog>
    </>
  )
}
