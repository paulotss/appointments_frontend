import PieChartIcon from '@mui/icons-material/PieChart'
import { BarChart } from '@mui/x-charts/BarChart'
import { Alert, Box, CircularProgress, Paper, Stack, TextField, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { listarRegistros } from '../services/registros.service'
import type { RegistroAtendimento } from '../types/registro'

function getInicioMesAtualISO(): string {
  const agora = new Date()
  const ano = agora.getFullYear()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  return `${ano}-${mes}-01`
}

function getFimMesAtualISO(): string {
  const agora = new Date()
  const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0)
  const ano = fimMes.getFullYear()
  const mes = String(fimMes.getMonth() + 1).padStart(2, '0')
  const dia = String(fimMes.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function toDataLocalISO(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value)
  const ano = date.getFullYear()
  const mes = String(date.getMonth() + 1).padStart(2, '0')
  const dia = String(date.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function labelData(value: string): string {
  const [anoStr, mesStr, diaStr] = value.split('-')
  const date = new Date(Number(anoStr), Number(mesStr) - 1, Number(diaStr))
  return new Intl.DateTimeFormat('pt-BR').format(date)
}

export function EspecialidadesAtendidasPage() {
  const [registros, setRegistros] = useState<RegistroAtendimento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dataInicio, setDataInicio] = useState(getInicioMesAtualISO())
  const [dataFim, setDataFim] = useState(getFimMesAtualISO())

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

  const dadosBarras = useMemo(() => {
    const contagem = new Map<string, number>()
    const dataInicial = dataInicio <= dataFim ? dataInicio : dataFim
    const dataFinal = dataFim >= dataInicio ? dataFim : dataInicio

    registros
      .filter((r) => {
        const dataRegistro = toDataLocalISO(r.data)
        return dataRegistro >= dataInicial && dataRegistro <= dataFinal
      })
      .forEach((r) => {
        const especialidade = r.especialidade_nome?.trim() || 'Sem especialidade'
        contagem.set(especialidade, (contagem.get(especialidade) ?? 0) + 1)
      })

    const totaisOrdenados = Array.from(contagem.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    const totalAtendimentos = totaisOrdenados.reduce((acc, [, value]) => acc + value, 0)

    return totaisOrdenados.map(([especialidade, total]) => ({
      especialidade,
      percentual: totalAtendimentos > 0 ? Number(((total / totalAtendimentos) * 100).toFixed(2)) : 0,
    }))
  }, [dataFim, dataInicio, registros])

  const especialidades = dadosBarras.map((item) => item.especialidade)
  const percentuais = dadosBarras.map((item) => item.percentual)
  const alturaGrafico = Math.min(380, Math.max(240, dadosBarras.length * 38))

  return (
    <Stack spacing={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap">
        <Stack direction="row" spacing={1.25} alignItems="center">
          <PieChartIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>
            Relatórios · Especialidades atendidas
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ minWidth: 340 }}>
          <TextField
            label="Início"
            type="date"
            value={dataInicio}
            onChange={(event) => setDataInicio(event.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{ minWidth: 165 }}
          />
          <TextField
            label="Fim"
            type="date"
            value={dataFim}
            onChange={(event) => setDataFim(event.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{ minWidth: 165 }}
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
        <Paper sx={{ p: 1.5 }}>
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            Especialidades atendidas ({labelData(dataInicio)} a {labelData(dataFim)})
          </Typography>
          {dadosBarras.length === 0 ? (
            <Typography color="text.secondary">Nao existem registros para o período selecionado.</Typography>
          ) : (
            <Box sx={{ width: '100%', height: alturaGrafico }}>
              <BarChart
                layout="horizontal"
                margin={{ top: 8, right: 20, bottom: 24, left: 110 }}
                yAxis={[
                  {
                    scaleType: 'band',
                    data: especialidades,
                  },
                ]}
                xAxis={[
                  {
                    min: 0,
                    max: 100,
                    tickMinStep: 10,
                    tickMaxStep: 10,
                    valueFormatter: (value: number) => `${value}%`,
                  },
                ]}
                series={[
                  {
                    data: percentuais,
                    label: 'Percentual',
                    valueFormatter: (value: number | null) =>
                      `${(value ?? 0).toFixed(2)}%`,
                    color: '#1976d2',
                  },
                ]}
                barLabel={(item) => `${Number(item.value ?? 0).toFixed(1)}%`}
              />
            </Box>
          )}
        </Paper>
      ) : null}
    </Stack>
  )
}
