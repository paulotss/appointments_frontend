import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import { buscarMensagemPorId } from '../services/messages.service'
import type { Message, MessageRecordStatus } from '../types/message'

interface ChatMessageItem {
  id?: string
  role?: string
  type?: string
  text?: string
  time?: number
}

function formatarDataHora(value: string): string {
  const data = new Date(value)
  if (Number.isNaN(data.getTime())) {
    return value
  }
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(data)
}

function formatarTimestampUnix(time: number): string {
  const data = new Date(time * 1000)
  if (Number.isNaN(data.getTime())) {
    return String(time)
  }
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(data)
}

function statusRegistroLabel(status: MessageRecordStatus): string {
  if (status === 'registered') {
    return 'Registrado'
  }
  if (status === 'cancelled') {
    return 'Cancelado'
  }
  return 'Pendente'
}

function roleLabel(role: string | undefined): string {
  if (role === 'user') {
    return 'Paciente'
  }
  if (role === 'assistant') {
    return 'Assistente'
  }
  if (role === 'human' || role === 'agent') {
    return 'Atendente'
  }
  return role?.trim() || 'Mensagem'
}

function parseChatMessages(content: unknown): ChatMessageItem[] | null {
  if (!Array.isArray(content) || content.length === 0) {
    return null
  }
  const items = content.filter(
    (item): item is ChatMessageItem =>
      item != null &&
      typeof item === 'object' &&
      ('text' in item || 'role' in item || 'type' in item),
  )
  return items.length > 0 ? items : null
}

function formatContentFallback(content: unknown): string {
  try {
    return JSON.stringify(content, null, 2)
  } catch {
    return String(content)
  }
}

export function MensagemDetalhePage() {
  const navigate = useNavigate()
  const { messageId: messageIdParam } = useParams<{ messageId: string }>()
  const messageIdNum =
    messageIdParam != null && messageIdParam !== ''
      ? Number.parseInt(messageIdParam, 10)
      : Number.NaN

  const [mensagem, setMensagem] = useState<Message | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!Number.isFinite(messageIdNum)) {
      setLoading(false)
      setError('Identificador da mensagem invalido.')
      setMensagem(null)
      return
    }

    let cancelado = false

    async function carregar() {
      setLoading(true)
      setError(null)
      try {
        const data = await buscarMensagemPorId(messageIdNum)
        if (!cancelado) {
          setMensagem(data)
        }
      } catch {
        if (!cancelado) {
          setError('Nao foi possivel carregar os detalhes da mensagem.')
          setMensagem(null)
        }
      } finally {
        if (!cancelado) {
          setLoading(false)
        }
      }
    }

    void carregar()

    return () => {
      cancelado = true
    }
  }, [messageIdNum])

  const chatMessages = mensagem ? parseChatMessages(mensagem.content) : null

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap">
        <Typography variant="h5" fontWeight={700}>
          {Number.isFinite(messageIdNum) ? `Mensagem #${messageIdNum}` : 'Mensagem'}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/mensagens')}
        >
          Voltar para mensagens
        </Button>
      </Stack>

      {loading ? (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <CircularProgress size={20} />
          <Typography>Carregando...</Typography>
        </Stack>
      ) : null}

      {error ? <Alert severity="error">{error}</Alert> : null}

      {!loading && !error && mensagem ? (
        <Stack spacing={2}>
          <Paper sx={{ p: 2 }}>
            <Stack spacing={1.5} divider={<Divider flexItem />}>
              <DetalheLinha rotulo="Paciente" valor={mensagem.name?.trim() || '—'} />
              <DetalheLinha rotulo="Finalizada em" valor={formatarDataHora(mensagem.finishAt)} />
              <DetalheLinha rotulo="Destinatário" valor={mensagem.recipient} />
              <DetalheLinha rotulo="Interaction ID" valor={mensagem.interactionId} />
              <DetalheLinha rotulo="Registro" valor={statusRegistroLabel(mensagem.recordStatus)} />
              {mensagem.note?.trim() ? (
                <DetalheLinha rotulo="Observação do registro" valor={mensagem.note.trim()} />
              ) : null}
              <DetalheLinha rotulo="Usuário" valor={mensagem.user?.name?.trim() || '—'} />
              {mensagem.appointment ? (
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Registro de atendimento vinculado
                  </Typography>
                  <DetalheLinha rotulo="ID do registro" valor={String(mensagem.appointment.id)} />
                  <DetalheLinha rotulo="Paciente" valor={mensagem.appointment.clientName} />
                  <DetalheLinha
                    rotulo="Data do atendimento"
                    valor={formatarDataHora(mensagem.appointment.date)}
                  />
                  <Button component={RouterLink} to="/registros" variant="text" size="small">
                    Ir para listagem de registros
                  </Button>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Nenhum registro de atendimento vinculado a esta mensagem.
                </Typography>
              )}
            </Stack>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
              Conteúdo da conversa
            </Typography>
            {mensagem.content == null ? (
              <Typography variant="body2" color="text.secondary">
                Nenhum conteúdo disponível para esta mensagem.
              </Typography>
            ) : chatMessages ? (
              <Stack spacing={1.5}>
                {chatMessages.map((item, index) => {
                  const fromUser = item.role === 'user'
                  return (
                    <Box
                      key={item.id ?? `msg-${index}`}
                      sx={{
                        alignSelf: fromUser ? 'flex-end' : 'flex-start',
                        maxWidth: { xs: '100%', sm: '85%' },
                        bgcolor: fromUser ? 'primary.main' : 'action.hover',
                        color: fromUser ? 'primary.contrastText' : 'text.primary',
                        px: 1.5,
                        py: 1,
                        borderRadius: 2,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ opacity: 0.85, display: 'block', mb: 0.25 }}
                      >
                        {roleLabel(item.role)}
                        {typeof item.time === 'number'
                          ? ` · ${formatarTimestampUnix(item.time)}`
                          : ''}
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {item.text?.trim() || '—'}
                      </Typography>
                    </Box>
                  )
                })}
              </Stack>
            ) : (
              <Box
                component="pre"
                sx={{
                  m: 0,
                  p: 1.5,
                  bgcolor: 'action.hover',
                  borderRadius: 1,
                  overflow: 'auto',
                  fontSize: 12,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                }}
              >
                {formatContentFallback(mensagem.content)}
              </Box>
            )}
          </Paper>
        </Stack>
      ) : null}
    </Stack>
  )
}

function DetalheLinha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0.5}>
      <Typography component="span" variant="body2" color="text.secondary" sx={{ minWidth: 160 }}>
        {rotulo}
      </Typography>
      <Typography component="span" variant="body2" fontWeight={500}>
        {valor}
      </Typography>
    </Stack>
  )
}
