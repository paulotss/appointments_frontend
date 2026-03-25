import AddIcon from '@mui/icons-material/Add'
import BarChartIcon from '@mui/icons-material/BarChart'
import TableRowsIcon from '@mui/icons-material/TableRows'
import { BarChart } from '@mui/x-charts/BarChart'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RegistrosTable } from '../components/RegistrosTable'
import { getIsAdmin, getLoggedUser } from '../services/authStorage'
import { listarRegistros } from '../services/registros.service'
import { listarUsuarios } from '../services/users.service'
import type { RegistroAtendimento } from '../types/registro'

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

export function RegistrosPage() {
  const navigate = useNavigate()
  const loggedUser = getLoggedUser()
  const isAdmin = getIsAdmin()
  const filtroDataPadrao = getHojeLocalISO()
  const filtroAtendentePadrao = loggedUser?.name ?? ''
  const [registros, setRegistros] = useState<RegistroAtendimento[]>([])
  const [usuarios, setUsuarios] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtroData, setFiltroData] = useState(filtroDataPadrao)
  const [filtroAtendente, setFiltroAtendente] = useState(filtroAtendentePadrao)
  const [modoVisualizacao, setModoVisualizacao] = useState<'tabela' | 'grafico'>('tabela')
  const [agrupamentoPeriodo, setAgrupamentoPeriodo] = useState<'dia' | 'mes'>('dia')

  useEffect(() => {
    async function carregarRegistros() {
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

    void carregarRegistros()
  }, [])

  const atendentes = useMemo(() => {
    if (usuarios.length > 0) {
      return usuarios
    }
    const unicos = Array.from(new Set(registros.map((registro) => registro.atendente)))
    return unicos.sort((a, b) => a.localeCompare(b))
  }, [registros, usuarios])

  const registrosFiltrados = useMemo(() => {
    return registros.filter((registro) => {
      const dataRegistro = toDataLocalISO(registro.data)
      const dataOk = !filtroData || dataRegistro === filtroData
      const atendenteOk = !filtroAtendente || registro.atendente === filtroAtendente
      return dataOk && atendenteOk
    })
  }, [filtroAtendente, filtroData, registros])

  const dadosGrafico = useMemo(() => {
    const agrupado = new Map<string, { whatsapp: number; telefone: number; outro: number }>()

    registrosFiltrados.forEach((registro) => {
      const dataRegistro = new Date(registro.data)
      const periodo =
        agrupamentoPeriodo === 'mes'
          ? `${dataRegistro.getFullYear()}-${String(dataRegistro.getMonth() + 1).padStart(2, '0')}`
          : `${dataRegistro.getFullYear()}-${String(dataRegistro.getMonth() + 1).padStart(2, '0')}-${String(dataRegistro.getDate()).padStart(2, '0')}`

      const atual = agrupado.get(periodo) ?? { whatsapp: 0, telefone: 0, outro: 0 }
      atual[registro.atendimento] += 1
      agrupado.set(periodo, atual)
    })

    const periodos = Array.from(agrupado.keys()).sort((a, b) => a.localeCompare(b))

    return {
      periodos,
      whatsapp: periodos.map((periodo) => agrupado.get(periodo)?.whatsapp ?? 0),
      telefone: periodos.map((periodo) => agrupado.get(periodo)?.telefone ?? 0),
      outro: periodos.map((periodo) => agrupado.get(periodo)?.outro ?? 0),
    }
  }, [agrupamentoPeriodo, registrosFiltrados])

  return (
    <Stack spacing={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Registros de atendimentos
        </Typography>
        <Stack direction="row" spacing={1.5}>
          {isAdmin ? (
            <Button variant="outlined" onClick={() => navigate('/especialidades')}>
              Especialidades
            </Button>
          ) : null}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/registros/novo')}
          >
            Novo registro
          </Button>
        </Stack>
      </Box>

      {loading ? (
        <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress size={20} />
          <Typography>Carregando registros...</Typography>
        </Paper>
      ) : null}

      {error ? <Alert severity="error">{error}</Alert> : null}

      {!loading && !error && registros.length > 0 ? (
        <Paper sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap">
            <TextField
              label="Filtrar por data"
              type="date"
              value={filtroData}
              onChange={(event) => setFiltroData(event.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 220 }}
            />
            <TextField
              select
              label="Filtrar por atendente"
              value={filtroAtendente}
              onChange={(event) => setFiltroAtendente(event.target.value)}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="">Todos</MenuItem>
              {atendentes.map((atendente) => (
                <MenuItem key={atendente} value={atendente}>
                  {atendente}
                </MenuItem>
              ))}
            </TextField>
            <Button
              variant="outlined"
              onClick={() => {
                setFiltroData('')
                setFiltroAtendente('')
              }}
            >
              Limpar filtros
            </Button>
            <TextField
              select
              label="Período do gráfico"
              value={agrupamentoPeriodo}
              onChange={(event) => {
                const proximoPeriodo = event.target.value as 'dia' | 'mes'
                setAgrupamentoPeriodo(proximoPeriodo)
                if (proximoPeriodo === 'mes') {
                  setFiltroData('')
                  setFiltroAtendente('')
                }
              }}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="dia">Dia</MenuItem>
              <MenuItem value="mes">Mês</MenuItem>
            </TextField>
            <Button
              variant={modoVisualizacao === 'grafico' ? 'contained' : 'outlined'}
              startIcon={modoVisualizacao === 'grafico' ? <TableRowsIcon /> : <BarChartIcon />}
              onClick={() =>
                setModoVisualizacao((prev) => (prev === 'grafico' ? 'tabela' : 'grafico'))
              }
            >
              {modoVisualizacao === 'grafico' ? 'Ver tabela' : 'Ver gráfico'}
            </Button>
          </Stack>
        </Paper>
      ) : null}

      {!loading && !error && registros.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography>Nenhum registro encontrado.</Typography>
        </Paper>
      ) : null}

      {!loading && !error && registros.length > 0 && registrosFiltrados.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography>Nenhum registro para os filtros selecionados.</Typography>
        </Paper>
      ) : null}

      {!loading && !error && registrosFiltrados.length > 0 && modoVisualizacao === 'tabela' ? (
        <Paper sx={{ p: 0 }}>
          <RegistrosTable registros={registrosFiltrados} />
        </Paper>
      ) : null}

      {!loading && !error && registrosFiltrados.length > 0 && modoVisualizacao === 'grafico' ? (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Quantidade de atendimentos por {agrupamentoPeriodo === 'dia' ? 'dia' : 'mês'}
          </Typography>
          <Box sx={{ width: '100%', height: 380 }}>
            <BarChart
              xAxis={[
                {
                  data: dadosGrafico.periodos,
                  scaleType: 'band',
                  label: agrupamentoPeriodo === 'dia' ? 'Dia' : 'Mês',
                },
              ]}
              yAxis={[{ label: 'Quantidade de atendimentos' }]}
              series={[
                { data: dadosGrafico.whatsapp, label: 'WhatsApp', stack: 'total' },
                { data: dadosGrafico.telefone, label: 'Telefone', stack: 'total' },
                { data: dadosGrafico.outro, label: 'Outro', stack: 'total' },
              ]}
            />
          </Box>
        </Paper>
      ) : null}
    </Stack>
  )
}
