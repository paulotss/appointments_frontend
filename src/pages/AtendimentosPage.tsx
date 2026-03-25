import PersonIcon from '@mui/icons-material/Person'
import { BarChart } from '@mui/x-charts/BarChart'
import { PieChart } from '@mui/x-charts/PieChart'
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
import { listarUsuarios } from '../services/users.service'
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

function diasNoMes(mesIso: string): number {
  const [anoStr, mesStr] = mesIso.split('-')
  const ano = Number(anoStr)
  const mesIndex = Number(mesStr) - 1
  return new Date(ano, mesIndex + 1, 0).getDate()
}

function toDiaDoMesLocal(value: string | Date): number {
  const date = value instanceof Date ? value : new Date(value)
  return date.getDate()
}

export function AtendimentosPage() {
  const [registros, setRegistros] = useState<RegistroAtendimento[]>([])
  const [usuarios, setUsuarios] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [mesSelecionado, setMesSelecionado] = useState(getMesAtualISO())
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<string>('')

  useEffect(() => {
    async function carregar() {
      setLoading(true)
      setError(null)
      try {
        const [registrosData, usuariosData] = await Promise.all([listarRegistros(), listarUsuarios()])
        setRegistros(registrosData)
        const nomesUsuarios = usuariosData
          .map((usuario) => usuario.name.trim())
          .filter((nome) => nome.length > 0)
          .sort((a, b) => a.localeCompare(b))
        setUsuarios(Array.from(new Set(nomesUsuarios)))
      } catch {
        setError('Nao foi possivel carregar os registros.')
      } finally {
        setLoading(false)
      }
    }

    void carregar()
  }, [])

  const mesesDisponiveis = useMemo(() => {
    const unicos = Array.from(new Set(registros.map((r) => toMesLocalISO(r.data))))
    unicos.sort((a, b) => b.localeCompare(a))
    return unicos
  }, [registros])

  const usuariosDisponiveis = useMemo(() => {
    if (usuarios.length > 0) return usuarios
    const unicos = Array.from(new Set(registros.map((r) => r.atendente))).filter((n) => n.trim().length > 0)
    return unicos.sort((a, b) => a.localeCompare(b))
  }, [registros, usuarios])

  useEffect(() => {
    if (loading) return
    if (mesesDisponiveis.length === 0) return
    if (mesesDisponiveis.includes(mesSelecionado)) return
    setMesSelecionado(mesesDisponiveis[0])
  }, [loading, mesesDisponiveis, mesSelecionado])

  useEffect(() => {
    if (loading) return
    if (usuariosDisponiveis.length === 0) return
    if (usuarioSelecionado) return
    setUsuarioSelecionado(usuariosDisponiveis[0])
  }, [loading, usuarioSelecionado, usuariosDisponiveis])

  const registrosFiltrados = useMemo(() => {
    return registros.filter((r) => {
      const mesOk = toMesLocalISO(r.data) === mesSelecionado
      const userOk = !usuarioSelecionado || r.atendente === usuarioSelecionado
      return mesOk && userOk
    })
  }, [mesSelecionado, registros, usuarioSelecionado])

  const dadosGrafico = useMemo(() => {
    const totalDias = diasNoMes(mesSelecionado)
    const contagemPorDia = new Array<number>(totalDias).fill(0)
    registrosFiltrados.forEach((r) => {
      const dia = toDiaDoMesLocal(r.data)
      if (dia >= 1 && dia <= totalDias) contagemPorDia[dia - 1] += 1
    })
    const dias = Array.from({ length: totalDias }, (_, i) => String(i + 1))
    return { dias, contagens: contagemPorDia }
  }, [mesSelecionado, registrosFiltrados])

  const dadosPizza = useMemo(() => {
    const registrosDoMes = registros.filter((r) => toMesLocalISO(r.data) === mesSelecionado)
    const contagem = new Map<string, number>()

    registrosDoMes.forEach((r) => {
      const nomeRaw = r.atendente
      const nome = (typeof nomeRaw === 'string' ? nomeRaw.trim() : '') || 'Sem atendente'
      contagem.set(nome, (contagem.get(nome) ?? 0) + 1)
    })

    return Array.from(contagem.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([label, value], idx) => ({ id: `${label}-${idx}`, label, value }))
  }, [mesSelecionado, registros])

  const tituloUsuario = usuarioSelecionado ? usuarioSelecionado : 'Usuário'

  return (
    <Stack spacing={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap">
        <Stack direction="row" spacing={1.25} alignItems="center">
          <PersonIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>
            Relatórios · Atendimentos
          </Typography>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
          <TextField
            select
            label="Mês"
            value={mesSelecionado}
            onChange={(event) => setMesSelecionado(event.target.value)}
            sx={{ minWidth: 220 }}
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

          <TextField
            select
            label="Usuário"
            value={usuarioSelecionado}
            onChange={(event) => setUsuarioSelecionado(event.target.value)}
            sx={{ minWidth: 260 }}
          >
            {usuariosDisponiveis.map((nome) => (
              <MenuItem key={nome} value={nome}>
                {nome}
              </MenuItem>
            ))}
          </TextField>
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
        <Stack spacing={2}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Quantidade de atendimentos por dia ({labelMes(mesSelecionado)}) — {tituloUsuario}
            </Typography>
            <Box sx={{ width: '100%', height: 380 }}>
              <BarChart
                xAxis={[{ data: dadosGrafico.dias, scaleType: 'band', label: 'Dia do mês' }]}
                yAxis={[{ label: 'Quantidade' }]}
                series={[{ data: dadosGrafico.contagens, label: 'Atendimentos' }]}
              />
            </Box>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Soma de atendimentos por atendente ({labelMes(mesSelecionado)})
            </Typography>
            <Box sx={{ width: '100%', height: 380 }}>
              <PieChart
                series={[
                  {
                    data: dadosPizza,
                    highlightScope: { highlight: 'item', fade: 'global' },
                    innerRadius: 50,
                    paddingAngle: 2,
                    cornerRadius: 4,
                  },
                ]}
              />
            </Box>
          </Paper>
        </Stack>
      ) : null}
    </Stack>
  )
}

