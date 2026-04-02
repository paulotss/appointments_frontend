import PieChartIcon from '@mui/icons-material/PieChart'
import { PieChart } from '@mui/x-charts/PieChart'
import { Alert, Box, CircularProgress, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
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

export function EspecialidadesAtendidasPage() {
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

  const dadosPizza = useMemo(() => {
    const contagem = new Map<string, number>()

    registros
      .filter((r) => toMesLocalISO(r.data) === mesSelecionado)
      .forEach((r) => {
        const especialidade = r.especialidade_nome?.trim() || 'Sem especialidade'
        contagem.set(especialidade, (contagem.get(especialidade) ?? 0) + 1)
      })

    return Array.from(contagem.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([label, value], idx) => ({ id: `${label}-${idx}`, label, value }))
  }, [mesSelecionado, registros])

  return (
    <Stack spacing={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap">
        <Stack direction="row" spacing={1.25} alignItems="center">
          <PieChartIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>
            Relatórios · Especialidades atendidas
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
            Quantidade de especialidades atendidas ({labelMes(mesSelecionado)})
          </Typography>
          {dadosPizza.length === 0 ? (
            <Typography color="text.secondary">Nao existem registros para o mês selecionado.</Typography>
          ) : (
            <Box sx={{ width: '100%', height: 420 }}>
              <PieChart
                series={[
                  {
                    data: dadosPizza,
                    highlightScope: { highlight: 'item', fade: 'global' },
                    innerRadius: 55,
                    paddingAngle: 2,
                    cornerRadius: 4,
                  },
                ]}
              />
            </Box>
          )}
        </Paper>
      ) : null}
    </Stack>
  )
}
