import AccessTimeIcon from '@mui/icons-material/AccessTime'
import { BarChart } from '@mui/x-charts/BarChart'
import {
  Alert,
  Box,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { listarRegistros } from '../services/registros.service'
import type { RegistroAtendimento } from '../types/registro'

function getMesAtualISO(): string {
  const agora = new Date()
  const ano = agora.getFullYear()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  return `${ano}-${mes}`
}

function toMesLocalISO(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value)
  const ano = date.getFullYear()
  const mes = String(date.getMonth() + 1).padStart(2, '0')
  return `${ano}-${mes}`
}

function labelMes(value: string): string {
  const [anoStr, mesStr] = value.split('-')
  const ano = Number(anoStr)
  const mesIndex = Number(mesStr) - 1
  const date = new Date(ano, mesIndex, 1)
  const formatter = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
  const label = formatter.format(date)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function toHoraLocal(value: string | Date): number {
  const date = value instanceof Date ? value : new Date(value)
  return date.getHours()
}

export function HorariosPage() {
  const [registros, setRegistros] = useState<RegistroAtendimento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mesSelecionado, setMesSelecionado] = useState(getMesAtualISO())

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

  const mesesDisponiveis = useMemo(() => {
    const unicos = Array.from(new Set(registros.map((r) => toMesLocalISO(r.data))))
    unicos.sort((a, b) => b.localeCompare(a))
    return unicos
  }, [registros])

  useEffect(() => {
    if (loading) return
    if (mesesDisponiveis.length === 0) return
    if (mesesDisponiveis.includes(mesSelecionado)) return
    setMesSelecionado(mesesDisponiveis[0])
  }, [loading, mesesDisponiveis, mesSelecionado])

  const registrosDoMes = useMemo(() => {
    return registros.filter((r) => toMesLocalISO(r.data) === mesSelecionado)
  }, [mesSelecionado, registros])

  const dadosGrafico = useMemo(() => {
    const contagemPorHora = new Array<number>(24).fill(0)
    registrosDoMes.forEach((r) => {
      const hora = toHoraLocal(r.data)
      if (hora >= 0 && hora <= 23) {
        contagemPorHora[hora] += 1
      }
    })
    const horas = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))

    return { horas, contagens: contagemPorHora }
  }, [registrosDoMes])

  return (
    <Stack spacing={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap">
        <Stack direction="row" spacing={1.25} alignItems="center">
          <AccessTimeIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>
            Relatórios · Horários
          </Typography>
        </Stack>

        <TextField
          select
          label="Mês"
          value={mesSelecionado}
          onChange={(event) => setMesSelecionado(event.target.value)}
          sx={{ minWidth: 240 }}
        >
          {mesesDisponiveis.length === 0 ? (
            <MenuItem value={mesSelecionado}>{labelMes(mesSelecionado)}</MenuItem>
          ) : (
            mesesDisponiveis.map((mes) => (
              <MenuItem key={mes} value={mes}>
                {labelMes(mes)}
              </MenuItem>
            ))
          )}
        </TextField>
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
            Quantidade de atendimentos por hora ({labelMes(mesSelecionado)})
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

