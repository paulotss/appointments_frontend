import AccessTimeIcon from '@mui/icons-material/AccessTime'
import { BarChart } from '@mui/x-charts/BarChart'
import {
  Alert,
  Box,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { listarRegistros } from '../services/registros.service'
import type { RegistroAtendimento } from '../types/registro'

function getDataHojeISO(): string {
  const agora = new Date()
  const ano = agora.getFullYear()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function getInicioMesAtualISO(): string {
  const agora = new Date()
  const ano = agora.getFullYear()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  return `${ano}-${mes}-01`
}

function formatarData(value: string): string {
  if (!value) return '-'
  const [ano, mes, dia] = value.split('-')
  if (!ano || !mes || !dia) return value
  return `${dia}/${mes}/${ano}`
}

function toHoraLocal(value: string | Date): number {
  const date = value instanceof Date ? value : new Date(value)
  return date.getHours()
}

export function HorariosPage() {
  const [registros, setRegistros] = useState<RegistroAtendimento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dataInicio, setDataInicio] = useState(getInicioMesAtualISO())
  const [dataFim, setDataFim] = useState(getDataHojeISO())

  useEffect(() => {
    async function carregarRegistros() {
      setLoading(true)
      setError(null)
      try {
        const data = await listarRegistros()
        setRegistros(data)
      } catch {
        setError('Nao foi possivel carregar os registros.')
      } finally {
        setLoading(false)
      }
    }

    void carregarRegistros()
  }, [])

  const registrosDoPeriodo = useMemo(() => {
    if (!dataInicio || !dataFim) return registros

    const inicio = new Date(`${dataInicio}T00:00:00`)
    const fim = new Date(`${dataFim}T23:59:59.999`)

    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime()) || inicio > fim) {
      return []
    }

    return registros.filter((r) => {
      const dataRegistro = new Date(r.data)
      return dataRegistro >= inicio && dataRegistro <= fim
    })
  }, [dataFim, dataInicio, registros])

  const dadosGrafico = useMemo(() => {
    const contagemPorHora = new Array<number>(24).fill(0)
    registrosDoPeriodo.forEach((r) => {
      const hora = toHoraLocal(r.data)
      if (hora >= 0 && hora <= 23) {
        contagemPorHora[hora] += 1
      }
    })
    const horas = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))

    return { horas, contagens: contagemPorHora }
  }, [registrosDoPeriodo])

  return (
    <Stack spacing={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap">
        <Stack direction="row" spacing={1.25} alignItems="center">
          <AccessTimeIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>
            Relatórios · Horários
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1.5} flexWrap="wrap">
          <TextField
            label="Início"
            type="date"
            value={dataInicio}
            onChange={(event) => setDataInicio(event.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 180 }}
          />
          <TextField
            label="Fim"
            type="date"
            value={dataFim}
            onChange={(event) => setDataFim(event.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 180 }}
          />
        </Stack>
      </Box>

      {loading ? (
        <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress size={20} />
          <Typography>Carregando registros...</Typography>
        </Paper>
      ) : null}

      {error ? <Alert severity="error">{error}</Alert> : null}

      {!loading && !error && registros.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography>Nenhum registro encontrado.</Typography>
        </Paper>
      ) : null}

      {!loading && !error && registros.length > 0 ? (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Quantidade de atendimentos por hora ({formatarData(dataInicio)} a {formatarData(dataFim)})
          </Typography>
          <Box sx={{ width: '100%', height: 380 }}>
            <BarChart
              xAxis={[{ data: dadosGrafico.horas, scaleType: 'band', label: 'Hora' }]}
              yAxis={[{ label: 'Quantidade' }]}
              series={[{ data: dadosGrafico.contagens, label: 'Atendimentos' }]}
            />
          </Box>
        </Paper>
      ) : null}
    </Stack>
  )
}

