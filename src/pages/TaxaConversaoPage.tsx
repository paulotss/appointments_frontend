import PercentIcon from '@mui/icons-material/Percent'
import { BarChart } from '@mui/x-charts/BarChart'
import { Alert, Box, CircularProgress, Paper, Stack, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { exportarRegistros } from '../services/registros.service'
import { CampoData } from '../components/CampoData'
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

  const intervaloInvalido = dataInicio > dataFim

  useEffect(() => {
    if (intervaloInvalido) {
      setRegistros([])
      return
    }

    async function carregarRegistros() {
      setLoading(true)
      setError(null)
      try {
        const from = dataInicio <= dataFim ? dataInicio : dataFim
        const to = dataFim >= dataInicio ? dataFim : dataInicio
        const data = await exportarRegistros({ from, to })
        setRegistros(data)
      } catch {
        setError('Nao foi possivel carregar os registros.')
        setRegistros([])
      } finally {
        setLoading(false)
      }
    }

    void carregarRegistros()
  }, [dataInicio, dataFim, intervaloInvalido])

  const conversaoPorUsuario = useMemo<ConversaoPorUsuario[]>(() => {
    if (intervaloInvalido) return []

    const mapa = new Map<string, { total: number; sim: number }>()

    registros.forEach((r) => {
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
  }, [intervaloInvalido, registros])

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
          <CampoData
            label="Início"
            value={dataInicio}
            onChange={setDataInicio}
          />
          <CampoData
            label="Fim"
            value={dataFim}
            onChange={setDataFim}
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

