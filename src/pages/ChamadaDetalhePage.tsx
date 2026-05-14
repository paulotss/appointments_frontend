import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import {
  Alert,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import { buscarChamadaPorId } from '../services/calls.service'
import type { Call, CallRecordStatus, CallStatus } from '../types/call'

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

function statusChamadaLabel(status: CallStatus): string {
  if (status === 'ATENDIDO') {
    return 'Atendido'
  }
  if (status === 'NAO_ATENDIDO') {
    return 'Não atendido'
  }
  return 'Realizado'
}

function statusRegistroLabel(status: CallRecordStatus): string {
  if (status === 'registered') {
    return 'Registrado'
  }
  if (status === 'cancelled') {
    return 'Cancelado'
  }
  return 'Pendente'
}

export function ChamadaDetalhePage() {
  const navigate = useNavigate()
  const { callId: callIdParam } = useParams<{ callId: string }>()
  const callIdNum =
    callIdParam != null && callIdParam !== '' ? Number.parseInt(callIdParam, 10) : Number.NaN

  const [chamada, setChamada] = useState<Call | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!Number.isFinite(callIdNum)) {
      setLoading(false)
      setError('Identificador da chamada invalido.')
      setChamada(null)
      return
    }

    let cancelado = false

    async function carregar() {
      setLoading(true)
      setError(null)
      try {
        const data = await buscarChamadaPorId(callIdNum)
        if (!cancelado) {
          setChamada(data)
        }
      } catch {
        if (!cancelado) {
          setError('Nao foi possivel carregar os detalhes da chamada.')
          setChamada(null)
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
  }, [callIdNum])

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap">
        <Typography variant="h5" fontWeight={700}>
          {Number.isFinite(callIdNum) ? `Chamada #${callIdNum}` : 'Chamada'}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/chamadas')}
        >
          Voltar para chamadas
        </Button>
      </Stack>

      {loading ? (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <CircularProgress size={20} />
          <Typography>Carregando...</Typography>
        </Stack>
      ) : null}

      {error ? <Alert severity="error">{error}</Alert> : null}

      {!loading && !error && chamada ? (
        <Paper sx={{ p: 2 }}>
          <Stack spacing={1.5} divider={<Divider flexItem />}>
            <DetalheLinha rotulo="Recebida em" valor={formatarDataHora(chamada.receivedAt)} />
            <DetalheLinha rotulo="Origem" valor={chamada.origin} />
            <DetalheLinha
              rotulo="Destino"
              valor={chamada.destination?.trim() ? chamada.destination : '—'}
            />
            <DetalheLinha rotulo="Ramal" valor={String(chamada.extension)} />
            <DetalheLinha rotulo="Status da chamada" valor={statusChamadaLabel(chamada.status)} />
            <DetalheLinha rotulo="Registro" valor={statusRegistroLabel(chamada.recordStatus)} />
            {chamada.note?.trim() ? (
              <DetalheLinha rotulo="Observação do registro" valor={chamada.note.trim()} />
            ) : null}
            <DetalheLinha
              rotulo="Usuário"
              valor={chamada.user?.name?.trim() || '—'}
            />
            {chamada.appointment ? (
              <Stack spacing={1}>
                <Typography variant="subtitle2" color="text.secondary">
                  Registro de atendimento vinculado
                </Typography>
                <DetalheLinha rotulo="ID do registro" valor={String(chamada.appointment.id)} />
                <DetalheLinha rotulo="Paciente" valor={chamada.appointment.clientName} />
                <DetalheLinha
                  rotulo="Data do atendimento"
                  valor={formatarDataHora(chamada.appointment.date)}
                />
                <Button component={RouterLink} to="/registros" variant="text" size="small">
                  Ir para listagem de registros
                </Button>
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Nenhum registro de atendimento vinculado a esta chamada.
              </Typography>
            )}
          </Stack>
        </Paper>
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
