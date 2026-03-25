import PercentIcon from '@mui/icons-material/Percent'
import { BarChart } from '@mui/x-charts/BarChart'
import { Alert, Box, CircularProgress, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { listarRegistros } from '../services/registros.service'
import type { RegistroAtendimento } from '../types/registro'

type ConversaoPorUsuario = {
  usuario: string
  total: number
  sim: number
  percentual: number
}

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

export function TaxaConversaoPage() {
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

  const conversaoPorUsuario = useMemo<ConversaoPorUsuario[]>(() => {
    const mapa = new Map<string, { total: number; sim: number }>()

    registros
      .filter((r) => toMesLocalISO(r.data) === mesSelecionado)
      .forEach((r) => {
      const nomeRaw = r.atendente
      const usuario = (typeof nomeRaw === 'string' ? nomeRaw.trim() : '') || 'Sem atendente'
      const atual = mapa.get(usuario) ?? { total: 0, sim: 0 }
      atual.total += 1
      if (r.agendamento === 'sim') atual.sim += 1
      mapa.set(usuario, atual)
    })

    return Array.from(mapa.entries())
      .map(([usuario, { total, sim }]) => ({
        usuario,
        total,
        sim,
        percentual: total === 0 ? 0 : (sim / total) * 100,
      }))
      .sort((a, b) => b.percentual - a.percentual || b.total - a.total || a.usuario.localeCompare(b.usuario))
  }, [mesSelecionado, registros])

  const chart = useMemo(() => {
    return {
      usuarios: conversaoPorUsuario.map((x) => x.usuario),
      percentuais: conversaoPorUsuario.map((x) => Number(x.percentual.toFixed(1))),
    }
  }, [conversaoPorUsuario])

  return (
    <Stack spacing={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap">
        <Stack direction="row" spacing={1.25} alignItems="center">
          <PercentIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>
            Relatórios · Taxa de conversão
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
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            Percentual de atendimentos com agendamento = sim, por usuário ({labelMes(mesSelecionado)})
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Cálculo por usuário: sim ÷ total × 100
          </Typography>
          <Box sx={{ width: '100%', height: 420 }}>
            <BarChart
              xAxis={[{ data: chart.usuarios, scaleType: 'band', label: 'Usuário' }]}
              yAxis={[{ min: 0, max: 100, label: '%' }]}
              series={[{ data: chart.percentuais, label: 'Conversão (%)' }]}
            />
          </Box>
        </Paper>
      ) : null}
    </Stack>
  )
}

