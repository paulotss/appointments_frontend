import BlockIcon from '@mui/icons-material/Block'
import CallReceivedIcon from '@mui/icons-material/CallReceived'
import NoteAddIcon from '@mui/icons-material/NoteAdd'
import PhoneMissedIcon from '@mui/icons-material/PhoneMissed'
import RefreshIcon from '@mui/icons-material/Refresh'
import TaskAltIcon from '@mui/icons-material/TaskAlt'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
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
import { atualizarChamada, listarChamadas } from '../services/calls.service'
import { getIsAdmin } from '../services/authStorage'
import { listarUsuarios } from '../services/users.service'
import {
  type FiltroRegistroChamada,
  useChamadasFiltros,
} from '../stores/pageFiltersStore'
import type { Call, CallRecordStatus, CallStatus } from '../types/call'
import type { ListMeta, RecordStatusCounts } from '../types/listEnvelope'
import { formatAtendenteExibicao } from '../utils/formatAtendente'

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

function recordStatusLabel(status: CallRecordStatus): string {
  if (status === 'registered') {
    return 'Registrado'
  }
  if (status === 'cancelled') {
    return 'Cancelado'
  }
  return 'Pendente'
}

function recordStatusColor(status: CallRecordStatus): string {
  if (status === 'registered') {
    return '#2e7d32'
  }
  if (status === 'cancelled') {
    return '#c62828'
  }
  return '#fbc02d'
}

function recordStatusTooltip(chamada: Call): string {
  if (chamada.recordStatus === 'cancelled') {
    const nota = chamada.note?.trim()
    if (nota) {
      return `${recordStatusLabel('cancelled')}: ${nota}`
    }
    return recordStatusLabel('cancelled')
  }
  return recordStatusLabel(chamada.recordStatus)
}

function callStatusIconProps(status: CallStatus): {
  Icon: typeof CallReceivedIcon
  label: string
  color: string
} {
  if (status === 'ATENDIDO') {
    return { Icon: CallReceivedIcon, label: 'Atendido', color: 'success.main' }
  }
  if (status === 'NAO_ATENDIDO') {
    return { Icon: PhoneMissedIcon, label: 'Não atendido', color: 'warning.main' }
  }
  return { Icon: TaskAltIcon, label: 'Realizado', color: 'info.main' }
}

function normalizarPeriodo(dataInicio: string, dataFim: string) {
  return {
    from: dataInicio <= dataFim ? dataInicio : dataFim,
    to: dataFim >= dataInicio ? dataFim : dataInicio,
  }
}

function montarStatusesChamada(
  mostrarNaoAtendidos: boolean,
  mostrarRealizados: boolean,
): CallStatus[] {
  const statuses: CallStatus[] = ['ATENDIDO']
  if (mostrarNaoAtendidos) {
    statuses.push('NAO_ATENDIDO')
  }
  if (mostrarRealizados) {
    statuses.push('REALIZADO')
  }
  return statuses
}

export function ChamadasPage() {
  const navigate = useNavigate()
  const isAdmin = getIsAdmin()

  const [chamadas, setChamadas] = useState<Call[]>([])
  const [counts, setCounts] = useState<RecordStatusCounts>(COUNTS_VAZIOS)
  const [meta, setMeta] = useState<ListMeta>(META_VAZIA)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(50)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionId, setActionId] = useState<number | null>(null)

  const [filtros, setFiltros] = useChamadasFiltros()
  const {
    dataInicio,
    dataFim,
    filtroRegistro,
    filtroAtendenteId,
    mostrarNaoAtendidos,
    mostrarRealizados,
  } = filtros
  const [atendentes, setAtendentes] = useState<{ id: number; label: string }[]>([])

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<Call | null>(null)
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
      const result = await listarChamadas({
        from,
        to,
        ...(filtroRegistro !== 'all' ? { recordStatus: filtroRegistro } : {}),
        ...(isAdmin && filtroAtendenteId
          ? { userId: Number(filtroAtendenteId) }
          : {}),
        statuses: montarStatusesChamada(mostrarNaoAtendidos, mostrarRealizados),
        page: page + 1,
        limit: rowsPerPage,
      })
      setChamadas(result.data)
      setCounts(result.counts)
      setMeta(result.meta)
    } catch {
      setError('Nao foi possivel carregar as chamadas.')
      setChamadas([])
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
    mostrarNaoAtendidos,
    mostrarRealizados,
    page,
    rowsPerPage,
  ])

  useEffect(() => {
    void carregar()
  }, [carregar])

  function abrirCancelar(chamada: Call) {
    if (chamada.recordStatus !== 'pending') {
      return
    }
    setCancelTarget(chamada)
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
      await atualizarChamada(cancelTarget.id, {
        recordStatus: 'cancelled',
        note: trimmed,
      })
      fecharCancelar()
      await carregar()
    } catch {
      setError('Nao foi possivel cancelar o registro da chamada.')
    } finally {
      setActionId(null)
    }
  }

  function handleRegistrar(chamada: Call) {
    if (chamada.recordStatus !== 'pending') {
      return
    }
    const telefone =
      chamada.status === 'REALIZADO'
        ? chamada.destination?.trim() || chamada.origin
        : chamada.origin
    const params = new URLSearchParams({
      callId: String(chamada.id),
      telefone,
    })
    navigate(`/registros/novo?${params.toString()}`)
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="h5" fontWeight={700}>
          Chamadas
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
          onChange={(e) => atualizarFiltros({ dataInicio: e.target.value })}
          InputLabelProps={{ shrink: true }}
          sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 220 } }}
        />
        <TextField
          label="Período final"
          type="date"
          size="small"
          value={dataFim}
          onChange={(e) => atualizarFiltros({ dataFim: e.target.value })}
          InputLabelProps={{ shrink: true }}
          sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 220 } }}
        />
        <FormControl size="small" sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 200 } }}>
          <InputLabel id="filtro-registro-label">Registro</InputLabel>
          <Select
            labelId="filtro-registro-label"
            label="Registro"
            value={filtroRegistro}
            onChange={(e) =>
              atualizarFiltros({ filtroRegistro: e.target.value as FiltroRegistroChamada })
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
        <FormControlLabel
          sx={{ width: { xs: '100%', sm: 'auto' }, m: 0 }}
          control={
            <Checkbox
              checked={mostrarNaoAtendidos}
              onChange={(e) => atualizarFiltros({ mostrarNaoAtendidos: e.target.checked })}
            />
          }
          label="Mostrar não atendidos"
        />
        <FormControlLabel
          sx={{ width: { xs: '100%', sm: 'auto' }, m: 0 }}
          control={
            <Checkbox
              checked={mostrarRealizados}
              onChange={(e) => atualizarFiltros({ mostrarRealizados: e.target.checked })}
            />
          }
          label="Mostrar realizados"
        />
      </Box>

      {loading ? (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <CircularProgress size={20} />
          <Typography>Carregando chamadas...</Typography>
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
                  <TableCell>Recebida em</TableCell>
                  <TableCell>Origem</TableCell>
                  <TableCell>Destino</TableCell>
                  <TableCell>Ramal</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Registro</TableCell>
                  <TableCell>Usuário</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {chamadas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <Typography color="text.secondary">Nenhuma chamada encontrada.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  chamadas.map((chamada) => {
                    const pendente = chamada.recordStatus === 'pending'
                    const busy = actionId === chamada.id
                    const { Icon: StatusIcon, label: statusLabel, color: statusColor } =
                      callStatusIconProps(chamada.status)
                    return (
                      <TableRow key={chamada.id} hover>
                        <TableCell>{formatarDataHora(chamada.receivedAt)}</TableCell>
                        <TableCell>{chamada.origin}</TableCell>
                        <TableCell>{chamada.destination?.trim() || '—'}</TableCell>
                        <TableCell>{chamada.extension}</TableCell>
                        <TableCell>
                          <Tooltip title={statusLabel} arrow>
                            <StatusIcon
                              sx={{ color: statusColor, verticalAlign: 'middle' }}
                              fontSize="small"
                            />
                          </Tooltip>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title={recordStatusTooltip(chamada)} arrow>
                            <Box
                              component="span"
                              sx={{
                                display: 'inline-block',
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                bgcolor: recordStatusColor(chamada.recordStatus),
                                verticalAlign: 'middle',
                              }}
                              aria-label={recordStatusTooltip(chamada)}
                            />
                          </Tooltip>
                        </TableCell>
                        <TableCell>{chamada.user?.name?.trim() || '—'}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <Tooltip title="Registrar">
                              <span>
                                <IconButton
                                  size="small"
                                  color="primary"
                                  disabled={!pendente || busy}
                                  onClick={() => handleRegistrar(chamada)}
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
                                  onClick={() => abrirCancelar(chamada)}
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
        <DialogTitle>Cancelar registro da chamada</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Descreva o motivo do cancelamento. A descrição será salva na chamada.
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
