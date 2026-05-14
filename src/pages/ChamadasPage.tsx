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
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { atualizarChamada, listarChamadas } from '../services/calls.service'
import { getIsAdmin, getLoggedUserId } from '../services/authStorage'
import type { Call, CallRecordStatus, CallStatus } from '../types/call'

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

export function ChamadasPage() {
  const navigate = useNavigate()
  const isAdmin = getIsAdmin()
  const loggedUserId = getLoggedUserId()

  const [chamadas, setChamadas] = useState<Call[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionId, setActionId] = useState<number | null>(null)

  const [dataInicio, setDataInicio] = useState(getHojeLocalISO())
  const [dataFim, setDataFim] = useState(getHojeLocalISO())

  const [mostrarNaoAtendidos, setMostrarNaoAtendidos] = useState(false)
  const [mostrarRealizados, setMostrarRealizados] = useState(false)
  const [filtroRegistro, setFiltroRegistro] = useState<CallRecordStatus>('pending')

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<Call | null>(null)
  const [cancelNote, setCancelNote] = useState('')
  const [cancelNoteError, setCancelNoteError] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listarChamadas()
      setChamadas(data)
    } catch {
      setError('Nao foi possivel carregar as chamadas.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void carregar()
  }, [carregar])

  const chamadasFiltradas = useMemo(() => {
    const ini = dataInicio <= dataFim ? dataInicio : dataFim
    const fim = dataFim >= dataInicio ? dataFim : dataInicio

    const statusPermitidos = new Set<CallStatus>(['ATENDIDO'])
    if (mostrarNaoAtendidos) {
      statusPermitidos.add('NAO_ATENDIDO')
    }
    if (mostrarRealizados) {
      statusPermitidos.add('REALIZADO')
    }

    return chamadas.filter((c) => {
      if (c.recordStatus !== filtroRegistro) {
        return false
      }
      if (!statusPermitidos.has(c.status)) {
        return false
      }
      if (!isAdmin) {
        if (loggedUserId == null) {
          return false
        }
        const visivelParaTodos = c.status === 'NAO_ATENDIDO'
        if (!visivelParaTodos && c.userId !== loggedUserId) {
          return false
        }
      }
      const dataRecebida = toDataLocalISO(c.receivedAt)
      return dataRecebida >= ini && dataRecebida <= fim
    })
  }, [
    chamadas,
    dataInicio,
    dataFim,
    filtroRegistro,
    isAdmin,
    loggedUserId,
    mostrarNaoAtendidos,
    mostrarRealizados,
  ])

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
      setChamadas((prev) =>
        prev.map((c) =>
          c.id === cancelTarget.id
            ? { ...c, recordStatus: 'cancelled' as const, note: trimmed }
            : c,
        ),
      )
      fecharCancelar()
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

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} flexWrap="wrap">
        <TextField
          label="Período inicial"
          type="date"
          size="small"
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 220 }}
        />
        <TextField
          label="Período final"
          type="date"
          size="small"
          value={dataFim}
          onChange={(e) => setDataFim(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 220 }}
        />
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="filtro-registro-label">Registro</InputLabel>
          <Select
            labelId="filtro-registro-label"
            label="Registro"
            value={filtroRegistro}
            onChange={(e) => setFiltroRegistro(e.target.value as CallRecordStatus)}
          >
            <MenuItem value="pending">Pendente</MenuItem>
            <MenuItem value="registered">Registrados</MenuItem>
            <MenuItem value="cancelled">Cancelados</MenuItem>
          </Select>
        </FormControl>
        <FormControlLabel
          control={
            <Checkbox
              checked={mostrarNaoAtendidos}
              onChange={(e) => setMostrarNaoAtendidos(e.target.checked)}
            />
          }
          label="Mostrar não atendidos"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={mostrarRealizados}
              onChange={(e) => setMostrarRealizados(e.target.checked)}
            />
          }
          label="Mostrar realizados"
        />
      </Stack>

      {loading ? (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <CircularProgress size={20} />
          <Typography>Carregando chamadas...</Typography>
        </Stack>
      ) : null}
      {error ? <Alert severity="error">{error}</Alert> : null}

      {!loading ? (
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
              {chamadasFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Typography color="text.secondary">Nenhuma chamada encontrada.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                chamadasFiltradas.map((chamada) => {
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
                          <StatusIcon sx={{ color: statusColor, verticalAlign: 'middle' }} fontSize="small" />
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
        </TableContainer>
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
