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
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getIsAdmin } from '../services/authStorage'
import { atualizarMensagem, listarMensagens } from '../services/messages.service'
import { listarUsuarios } from '../services/users.service'
import {
  type FiltroRegistroMensagem,
  useMensagensFiltros,
} from '../stores/pageFiltersStore'
import type { ListMeta, RecordStatusCounts } from '../types/listEnvelope'
import type { Message, MessageRecordStatus } from '../types/message'
import { formatAtendenteExibicao } from '../utils/formatAtendente'
import { CampoData } from '../components/CampoData'

const PAGE_SIZE_OPTIONS = [25, 50, 100]

const COUNTS_VAZIOS: RecordStatusCounts = {
  pending: 0,
  registered: 0,
  cancelled: 0,
  total: 0,
}

const META_VAZIA: ListMeta = {
  page: 1,
  limit: 50,
  total: 0,
  totalPages: 1,
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

function normalizarPeriodo(dataInicio: string, dataFim: string) {
  return {
    from: dataInicio <= dataFim ? dataInicio : dataFim,
    to: dataFim >= dataInicio ? dataFim : dataInicio,
  }
}

export function MensagensPage() {
  const navigate = useNavigate()
  const isAdmin = getIsAdmin()

  const [mensagens, setMensagens] = useState<Message[]>([])
  const [counts, setCounts] = useState<RecordStatusCounts>(COUNTS_VAZIOS)
  const [meta, setMeta] = useState<ListMeta>(META_VAZIA)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(50)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionId, setActionId] = useState<number | null>(null)

  const [filtros, setFiltros] = useMensagensFiltros()
  const { dataInicio, dataFim, filtroRegistro, filtroAtendenteId } = filtros
  const [atendentes, setAtendentes] = useState<{ id: number; label: string }[]>([])

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<Message | null>(null)
  const [cancelNote, setCancelNote] = useState('')
  const [cancelNoteError, setCancelNoteError] = useState<string | null>(null)

  const atualizarFiltros = useCallback(
    (partial: Parameters<typeof setFiltros>[0]) => {
      setFiltros(partial)
      setPage(0)
    },
    [setFiltros],
  )

  useEffect(() => {
    if (!isAdmin) {
      setAtendentes([])
      setFiltros({ filtroAtendenteId: '' })
      return
    }

    let cancelled = false
    void (async () => {
      try {
        const usuariosData = await listarUsuarios()
        if (cancelled) {
          return
        }
        setAtendentes(
          usuariosData
            .map((usuario) => ({
              id: usuario.id,
              label: formatAtendenteExibicao(usuario.name.trim(), usuario.extension),
            }))
            .filter((item) => item.label.length > 0)
            .sort((a, b) => a.label.localeCompare(b.label)),
        )
      } catch {
        if (!cancelled) {
          setError('Nao foi possivel carregar os atendentes.')
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isAdmin, setFiltros])

  const carregar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { from, to } = normalizarPeriodo(dataInicio, dataFim)
      const result = await listarMensagens({
        from,
        to,
        ...(filtroRegistro !== 'all' ? { recordStatus: filtroRegistro } : {}),
        ...(isAdmin && filtroAtendenteId
          ? { userId: Number(filtroAtendenteId) }
          : {}),
        page: page + 1,
        limit: rowsPerPage,
      })
      setMensagens(result.data)
      setCounts(result.counts)
      setMeta(result.meta)
    } catch {
      setError('Nao foi possivel carregar as mensagens.')
      setMensagens([])
      setCounts(COUNTS_VAZIOS)
      setMeta(META_VAZIA)
    } finally {
      setLoading(false)
    }
  }, [
    dataInicio,
    dataFim,
    filtroRegistro,
    filtroAtendenteId,
    isAdmin,
    page,
    rowsPerPage,
  ])

  useEffect(() => {
    void carregar()
  }, [carregar])

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
      fecharCancelar()
      await carregar()
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
    const nome = mensagem.name?.trim()
    if (nome) {
      params.set('nome', nome)
    }
    navigate(`/registros/novo?${params.toString()}`)
  }

  function handleAbrirDetalhe(mensagem: Message) {
    navigate(`/mensagens/${mensagem.id}`)
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
        <CampoData
          label="Período inicial"
          size="small"
          value={dataInicio}
          onChange={(next) => atualizarFiltros({ dataInicio: next })}
          sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 220 } }}
        />
        <CampoData
          label="Período final"
          size="small"
          value={dataFim}
          onChange={(next) => atualizarFiltros({ dataFim: next })}
          sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 220 } }}
        />
        <FormControl size="small" sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 200 } }}>
          <InputLabel id="filtro-registro-mensagem-label">Registro</InputLabel>
          <Select
            labelId="filtro-registro-mensagem-label"
            label="Registro"
            value={filtroRegistro}
            onChange={(e) =>
              atualizarFiltros({ filtroRegistro: e.target.value as FiltroRegistroMensagem })
            }
          >
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value="pending">Pendente</MenuItem>
            <MenuItem value="registered">Registrados</MenuItem>
            <MenuItem value="cancelled">Cancelados</MenuItem>
          </Select>
        </FormControl>
        {isAdmin ? (
          <TextField
            select
            size="small"
            label="Atendente"
            value={filtroAtendenteId}
            onChange={(e) => atualizarFiltros({ filtroAtendenteId: e.target.value })}
            sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 220 } }}
          >
            <MenuItem value="">Todos</MenuItem>
            {atendentes.map((atendente) => (
              <MenuItem key={atendente.id} value={String(atendente.id)}>
                {atendente.label}
              </MenuItem>
            ))}
          </TextField>
        ) : null}
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
              label={`Pendentes: ${counts.pending}`}
              size="small"
              sx={{ bgcolor: recordStatusColor('pending'), color: '#000' }}
            />
            <Chip
              label={`Registradas: ${counts.registered}`}
              size="small"
              sx={{ bgcolor: recordStatusColor('registered'), color: '#fff' }}
            />
            <Chip
              label={`Canceladas: ${counts.cancelled}`}
              size="small"
              sx={{ bgcolor: recordStatusColor('cancelled'), color: '#fff' }}
            />
            <Chip
              label={`Total: ${counts.total}`}
              size="small"
              sx={{ bgcolor: '#000', color: '#fff' }}
            />
          </Stack>

          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Finalizada em</TableCell>
                  <TableCell>Paciente</TableCell>
                  <TableCell>Destinatário</TableCell>
                  <TableCell align="center">Registro</TableCell>
                  <TableCell>Usuário</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mensagens.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography color="text.secondary">Nenhuma mensagem encontrada.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  mensagens.map((mensagem) => {
                    const pendente = mensagem.recordStatus === 'pending'
                    const busy = actionId === mensagem.id
                    return (
                      <TableRow
                        key={mensagem.id}
                        hover
                        onClick={() => handleAbrirDetalhe(mensagem)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>{formatarDataHora(mensagem.finishAt)}</TableCell>
                        <TableCell>{mensagem.name?.trim() || '—'}</TableCell>
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
                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
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
            <TablePagination
              component="div"
              count={meta.total}
              page={page}
              onPageChange={(_, nextPage) => setPage(nextPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(Number(e.target.value))
                setPage(0)
              }}
              rowsPerPageOptions={PAGE_SIZE_OPTIONS}
              labelRowsPerPage="Por página"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}–${to} de ${count !== -1 ? count : `mais de ${to}`}`
              }
            />
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
