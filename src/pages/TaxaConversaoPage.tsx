import PercentIcon from '@mui/icons-material/Percent'
import { BarChart } from '@mui/x-charts/BarChart'
import { Alert, Box, CircularProgress, Paper, Stack, TextField, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { listarRegistros } from '../services/registros.service'
import type { RegistroAtendimento } from '../types/registro'

type ConversaoPorUsuario = {
  usuario: string
  total: number
  sim: number
  percentual: number
}

function toDateISO(value: Date): string {
  const ano = value.getFullYear()
  const mes = String(value.getMonth() + 1).padStart(2, '0')
  const dia = String(value.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function getInicioMesAtualISO(): string {
  const agora = new Date()
  const ano = agora.getFullYear()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  return `${ano}-${mes}-01`
}

function parseDateISO(value: string, endOfDay = false): Date {
  const [ano, mes, dia] = value.split('-').map(Number)
  return endOfDay
    ? new Date(ano, mes - 1, dia, 23, 59, 59, 999)
    : new Date(ano, mes - 1, dia, 0, 0, 0, 0)
}

function formatarDataBR(value: string): string {
  const [ano, mes, dia] = value.split('-')
  return `${dia}/${mes}/${ano}`
}

export function TaxaConversaoPage() {
  const [registros, setRegistros] = useState<RegistroAtendimento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dataInicio, setDataInicio] = useState(getInicioMesAtualISO())
  const [dataFim, setDataFim] = useState(toDateISO(new Date()))

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

  const intervaloInvalido = dataInicio > dataFim

  const conversaoPorUsuario = useMemo<ConversaoPorUsuario[]>(() => {
    if (intervaloInvalido) return []

    const inicio = parseDateISO(dataInicio)
    const fim = parseDateISO(dataFim, true)
    const mapa = new Map<string, { total: number; sim: number }>()

    registros
      .filter((r) => {
        const dataRegistro = new Date(r.data)
        return dataRegistro >= inicio && dataRegistro <= fim
      })
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
  }, [dataFim, dataInicio, intervaloInvalido, registros])

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

        <Stack direction="row" spacing={1} sx={{ minWidth: 340 }}>
          <TextField
            label="Início"
            type="date"
            value={dataInicio}
            onChange={(event) => setDataInicio(event.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Fim"
            type="date"
            value={dataFim}
            onChange={(event) => setDataFim(event.target.value)}
            InputLabelProps={{ shrink: true }}
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
      {intervaloInvalido ? <Alert severity="warning">A data de início deve ser menor ou igual à data de fim.</Alert> : null}

      {!loading && !error && registros.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography>Nenhum registro encontrado.</Typography>
        </Paper>
      ) : null}

      {!loading && !error && registros.length > 0 ? (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            Percentual de atendimentos com agendamento = sim, por usuário ({formatarDataBR(dataInicio)} a{' '}
            {formatarDataBR(dataFim)})
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Cálculo por usuário: sim ÷ total × 100
          </Typography>
          {conversaoPorUsuario.length === 0 ? (
            <Typography color="text.secondary">Nenhum atendimento encontrado no período selecionado.</Typography>
          ) : (
            <Box sx={{ width: '100%', height: 420 }}>
              <BarChart
                xAxis={[{ data: chart.usuarios, scaleType: 'band', label: 'Usuário' }]}
                yAxis={[{ min: 0, max: 100, label: '%' }]}
                series={[{ data: chart.percentuais, label: 'Conversão (%)' }]}
              />
            </Box>
          )}
        </Paper>
      ) : null}
    </Stack>
  )
}

