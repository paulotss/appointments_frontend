import BlockIcon from '@mui/icons-material/Block'
import NoteAddIcon from '@mui/icons-material/NoteAdd'
import RefreshIcon from '@mui/icons-material/Refresh'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getIsAdmin, getLoggedUserId } from '../services/authStorage'
import { atualizarMensagem, listarMensagens } from '../services/messages.service'
import type { Message, MessageRecordStatus } from '../types/message'

type FiltroRegistro = MessageRecordStatus | 'all'

function getHojeLocalISO(): string {
  const agora = new Date()
  const ano = agora.getFullYear()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function toDataLocalISO(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value)
  const ano = date.getFullYear()
  const mes = String(date.getMonth() + 1).padStart(2, '0')
  const dia = String(date.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
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

function recordStatusLabel(status: MessageRecordStatus): string {
  if (status === 'registered') {
    return 'Registrado'
  }
  if (status === 'cancelled') {
    return 'Cancelado'
  }
  return 'Pendente'
}

function recordStatusColor(status: MessageRecordStatus): string {
  if (status === 'registered') {
    return '#2e7d32'
  }
  if (status === 'cancelled') {
    return '#c62828'
  }
  return '#fbc02d'
}

function recordStatusTooltip(mensagem: Message): string {
  if (mensagem.recordStatus === 'cancelled') {
    const nota = mensagem.note?.trim()
    if (nota) {
      return `${recordStatusLabel('cancelled')}: ${nota}`
    }
    return recordStatusLabel('cancelled')
  }
  return recordStatusLabel(mensagem.recordStatus)
}

export function MensagensPage() {
  const navigate = useNavigate()
  const isAdmin = getIsAdmin()
  const loggedUserId = getLoggedUserId()

  const [mensagens, setMensagens] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionId, setActionId] = useState<number | null>(null)

  const [dataInicio, setDataInicio] = useState(getHojeLocalISO())
  const [dataFim, setDataFim] = useState(getHojeLocalISO())
  const [filtroRegistro, setFiltroRegistro] = useState<FiltroRegistro>('pending')

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<Message | null>(null)
  const [cancelNote, setCancelNote] = useState('')
  const [cancelNoteError, setCancelNoteError] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listarMensagens()
      setMensagens(data)
    } catch {
      setError('Nao foi possivel carregar as mensagens.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void carregar()
  }, [carregar])

  const mensagensPorFiltrosGerais = useMemo(() => {
    const ini = dataInicio <= dataFim ? dataInicio : dataFim
    const fim = dataFim >= dataInicio ? dataFim : dataInicio

    return mensagens.filter((m) => {
      if (!isAdmin) {
        if (loggedUserId == null) {
          return false
        }
        if (m.userId !== loggedUserId) {
          return false
        }
      }
      const dataFinalizada = toDataLocalISO(m.finishAt)
      return dataFinalizada >= ini && dataFinalizada <= fim
    })
  }, [mensagens, dataInicio, dataFim, isAdmin, loggedUserId])

  const mensagensFiltradas = useMemo(() => {
    if (filtroRegistro === 'all') {
      return mensagensPorFiltrosGerais
    }
    return mensagensPorFiltrosGerais.filter((m) => m.recordStatus === filtroRegistro)
  }, [mensagensPorFiltrosGerais, filtroRegistro])

  const totaisRegistro = useMemo(() => {
    let pendentes = 0
    let registradas = 0
    let canceladas = 0
    for (const mensagem of mensagensPorFiltrosGerais) {
      if (mensagem.recordStatus === 'registered') {
        registradas += 1
      } else if (mensagem.recordStatus === 'cancelled') {
        canceladas += 1
      } else {
        pendentes += 1
      }
    }
    return {
      pendentes,
      registradas,
      canceladas,
      total: mensagensPorFiltrosGerais.length,
    }
  }, [mensagensPorFiltrosGerais])

  function abrirCancelar(mensagem: Message) {
    if (mensagem.recordStatus !== 'pending') {
      return
    }
    setCancelTarget(mensagem)
    setCancelNote('')
    setCancelNoteError(null)
    setCancelDialogOpen(true)
  }

  function fecharCancelar() {
    setCancelDialogOpen(false)
    setCancelTarget(null)
    setCancelNote('')
    setCancelNoteError(null)
  }

  async function confirmarCancelar() {
    if (!cancelTarget) {
      return
    }
    const trimmed = cancelNote.trim()
    if (!trimmed) {
      setCancelNoteError('Informe uma descrição.')
      return
    }
    setCancelNoteError(null)
    setActionId(cancelTarget.id)
    try {
      await atualizarMensagem(cancelTarget.id, {
        recordStatus: 'cancelled',
        note: trimmed,
      })
      setMensagens((prev) =>
        prev.map((m) =>
          m.id === cancelTarget.id
            ? { ...m, recordStatus: 'cancelled' as const, note: trimmed }
            : m,
        ),
      )
      fecharCancelar()
    } catch {
      setError('Nao foi possivel cancelar o registro da mensagem.')
    } finally {
      setActionId(null)
    }
  }

  function handleRegistrar(mensagem: Message) {
    if (mensagem.recordStatus !== 'pending') {
      return
    }
    const params = new URLSearchParams({
      messageId: String(mensagem.id),
      telefone: mensagem.recipient,
    })
    navigate(`/registros/novo?${params.toString()}`)
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="h5" fontWeight={700}>
          Mensagens
        </Typography>
        <Tooltip title="Atualizar lista">
          <span>
            <IconButton
              size="small"
              color="primary"
              onClick={() => void carregar()}
              disabled={loading}
              aria-label="Atualizar lista"
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-start' }}>
        <TextField
          label="Período inicial"
          type="date"
          size="small"
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 220 } }}
        />
        <TextField
          label="Período final"
          type="date"
          size="small"
          value={dataFim}
          onChange={(e) => setDataFim(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 220 } }}
        />
        <FormControl size="small" sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 200 } }}>
          <InputLabel id="filtro-registro-mensagem-label">Registro</InputLabel>
          <Select
            labelId="filtro-registro-mensagem-label"
            label="Registro"
            value={filtroRegistro}
            onChange={(e) => setFiltroRegistro(e.target.value as FiltroRegistro)}
          >
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value="pending">Pendente</MenuItem>
            <MenuItem value="registered">Registrados</MenuItem>
            <MenuItem value="cancelled">Cancelados</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <CircularProgress size={20} />
          <Typography>Carregando mensagens...</Typography>
        </Stack>
      ) : null}
      {error ? <Alert severity="error">{error}</Alert> : null}

      {!loading ? (
        <>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              label={`Pendentes: ${totaisRegistro.pendentes}`}
              size="small"
              sx={{ bgcolor: recordStatusColor('pending'), color: '#000' }}
            />
            <Chip
              label={`Registradas: ${totaisRegistro.registradas}`}
              size="small"
              sx={{ bgcolor: recordStatusColor('registered'), color: '#fff' }}
            />
            <Chip
              label={`Canceladas: ${totaisRegistro.canceladas}`}
              size="small"
              sx={{ bgcolor: recordStatusColor('cancelled'), color: '#fff' }}
            />
            <Chip
              label={`Total: ${totaisRegistro.total}`}
              size="small"
              sx={{ bgcolor: '#000', color: '#fff' }}
            />
          </Stack>

          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Finalizada em</TableCell>
                  <TableCell>Destinatário</TableCell>
                  <TableCell align="center">Registro</TableCell>
                  <TableCell>Usuário</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mensagensFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Typography color="text.secondary">Nenhuma mensagem encontrada.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  mensagensFiltradas.map((mensagem) => {
                    const pendente = mensagem.recordStatus === 'pending'
                    const busy = actionId === mensagem.id
                    return (
                      <TableRow key={mensagem.id} hover>
                        <TableCell>{formatarDataHora(mensagem.finishAt)}</TableCell>
                        <TableCell>{mensagem.recipient}</TableCell>
                        <TableCell align="center">
                          <Tooltip title={recordStatusTooltip(mensagem)} arrow>
                            <Box
                              component="span"
                              sx={{
                                display: 'inline-block',
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                bgcolor: recordStatusColor(mensagem.recordStatus),
                                verticalAlign: 'middle',
                              }}
                              aria-label={recordStatusTooltip(mensagem)}
                            />
                          </Tooltip>
                        </TableCell>
                        <TableCell>{mensagem.user?.name?.trim() || '—'}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <Tooltip title="Registrar">
                              <span>
                                <IconButton
                                  size="small"
                                  color="primary"
                                  disabled={!pendente || busy}
                                  onClick={() => handleRegistrar(mensagem)}
                                  aria-label="Registrar"
                                >
                                  <NoteAddIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Cancelar">
                              <span>
                                <IconButton
                                  size="small"
                                  color="error"
                                  disabled={!pendente || busy}
                                  onClick={() => abrirCancelar(mensagem)}
                                  aria-label="Cancelar"
                                >
                                  {busy ? (
                                    <CircularProgress color="inherit" size={18} />
                                  ) : (
                                    <BlockIcon fontSize="small" />
                                  )}
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      ) : null}

      <Dialog
        open={cancelDialogOpen}
        onClose={() => {
          if (actionId != null) {
            return
          }
          fecharCancelar()
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Cancelar registro da mensagem</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Descreva o motivo do cancelamento. A descrição será salva na mensagem.
            </Typography>
            <TextField
              label="Descrição"
              required
              fullWidth
              multiline
              minRows={3}
              value={cancelNote}
              onChange={(e) => {
                setCancelNote(e.target.value)
                if (cancelNoteError) {
                  setCancelNoteError(null)
                }
              }}
              error={Boolean(cancelNoteError)}
              helperText={cancelNoteError ?? undefined}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={fecharCancelar} disabled={actionId != null}>
            Voltar
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={actionId != null}
            onClick={() => void confirmarCancelar()}
          >
            {actionId != null ? 'Salvando...' : 'Confirmar cancelamento'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
