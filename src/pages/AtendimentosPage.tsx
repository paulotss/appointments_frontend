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

function toDataInputISO(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value)
  const ano = date.getFullYear()
  const mes = String(date.getMonth() + 1).padStart(2, '0')
  const dia = String(date.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function inicioMesISO(mesIso: string): string {
  return `${mesIso}-01`
}

function fimMesISO(mesIso: string): string {
  const [anoStr, mesStr] = mesIso.split('-')
  const ano = Number(anoStr)
  const mesIndex = Number(mesStr) - 1
  const ultimoDia = new Date(ano, mesIndex + 1, 0).getDate()
  return `${mesIso}-${String(ultimoDia).padStart(2, '0')}`
}

function toDiaLocal(value: string | Date): Date {
  const date = value instanceof Date ? value : new Date(value)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function parseDataInputISO(value: string): Date {
  const [anoStr, mesStr, diaStr] = value.split('-')
  const ano = Number(anoStr)
  const mes = Number(mesStr) - 1
  const dia = Number(diaStr)
  return new Date(ano, mes, dia)
}

function formatarDataPtBR(value: string): string {
  return parseDataInputISO(value).toLocaleDateString('pt-BR')
}

function formatarTipoAtendimento(tipo: RegistroAtendimento['atendimento']): string {
  if (tipo === 'whatsapp') return 'WhatsApp'
  if (tipo === 'telefone') return 'Telefone'
  return 'Outro'
}

function gerarListaDatas(inicio: Date, fim: Date): string[] {
  const datas: string[] = []
  const cursor = new Date(inicio)
  while (cursor <= fim) {
    datas.push(toDataInputISO(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return datas
}

export function AtendimentosPage() {
  const [registros, setRegistros] = useState<RegistroAtendimento[]>([])
  const [usuarios, setUsuarios] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const mesAtual = getMesAtualISO()
  const [dataInicio, setDataInicio] = useState(inicioMesISO(mesAtual))
  const [dataFim, setDataFim] = useState(fimMesISO(mesAtual))
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
    const mesMaisRecente = mesesDisponiveis[0]
    setDataInicio(inicioMesISO(mesMaisRecente))
    setDataFim(fimMesISO(mesMaisRecente))
  }, [loading, mesesDisponiveis])

  useEffect(() => {
    if (loading) return
    if (usuariosDisponiveis.length === 0) return
    if (usuarioSelecionado) return
    setUsuarioSelecionado(usuariosDisponiveis[0])
  }, [loading, usuarioSelecionado, usuariosDisponiveis])

  const { inicioPeriodo, fimPeriodo } = useMemo(() => {
    const inicio = parseDataInputISO(dataInicio)
    const fim = parseDataInputISO(dataFim)
    return inicio <= fim ? { inicioPeriodo: inicio, fimPeriodo: fim } : { inicioPeriodo: fim, fimPeriodo: inicio }
  }, [dataFim, dataInicio])

  const periodoSelecionadoLabel = useMemo(() => {
    return `${formatarDataPtBR(toDataInputISO(inicioPeriodo))} a ${formatarDataPtBR(toDataInputISO(fimPeriodo))}`
  }, [fimPeriodo, inicioPeriodo])

  const registrosFiltrados = useMemo(() => {
    return registros.filter((r) => {
      const dataRegistro = toDiaLocal(r.data)
      const periodoOk = dataRegistro >= inicioPeriodo && dataRegistro <= fimPeriodo
      const userOk = !usuarioSelecionado || r.atendente === usuarioSelecionado
      return periodoOk && userOk
    })
  }, [fimPeriodo, inicioPeriodo, registros, usuarioSelecionado])

  const dadosGrafico = useMemo(() => {
    const datasPeriodo = gerarListaDatas(inicioPeriodo, fimPeriodo)
    const contagemPorData = new Map<string, number>(datasPeriodo.map((data) => [data, 0]))

    registrosFiltrados.forEach((r) => {
      const data = toDataInputISO(r.data)
      if (contagemPorData.has(data)) {
        contagemPorData.set(data, (contagemPorData.get(data) ?? 0) + 1)
      }
    })

    const labels = datasPeriodo.map((data) => formatarDataPtBR(data))
    const contagens = datasPeriodo.map((data) => contagemPorData.get(data) ?? 0)
    return { labels, contagens }
  }, [fimPeriodo, inicioPeriodo, registrosFiltrados])

  const registrosDoPeriodo = useMemo(() => {
    return registros.filter((r) => {
      const dataRegistro = toDiaLocal(r.data)
      return dataRegistro >= inicioPeriodo && dataRegistro <= fimPeriodo
    })
  }, [fimPeriodo, inicioPeriodo, registros])

  const dadosPizzaAtendente = useMemo(() => {
    const contagem = new Map<string, number>()

    registrosDoPeriodo.forEach((r) => {
      const nomeRaw = r.atendente
      const nome = (typeof nomeRaw === 'string' ? nomeRaw.trim() : '') || 'Sem atendente'
      contagem.set(nome, (contagem.get(nome) ?? 0) + 1)
    })

    return Array.from(contagem.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([label, value], idx) => ({ id: `atendente-${label}-${idx}`, label, value }))
  }, [registrosDoPeriodo])

  const dadosPizzaTipoAtendimento = useMemo(() => {
    const contagem = new Map<RegistroAtendimento['atendimento'], number>()

    registrosDoPeriodo.forEach((r) => {
      contagem.set(r.atendimento, (contagem.get(r.atendimento) ?? 0) + 1)
    })

    return Array.from(contagem.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([tipo, value], idx) => ({
        id: `tipo-${tipo}-${idx}`,
        label: formatarTipoAtendimento(tipo),
        value,
      }))
  }, [registrosDoPeriodo])

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
            type="date"
            label="Início"
            value={dataInicio}
            onChange={(event) => setDataInicio(event.target.value)}
            sx={{ minWidth: 190 }}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            type="date"
            label="Fim"
            value={dataFim}
            onChange={(event) => setDataFim(event.target.value)}
            sx={{ minWidth: 190 }}
            InputLabelProps={{ shrink: true }}
          />

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
              Quantidade de atendimentos por dia ({periodoSelecionadoLabel}) — {tituloUsuario}
            </Typography>
            <Box sx={{ width: '100%', height: 380 }}>
              <BarChart
                xAxis={[{ data: dadosGrafico.labels, scaleType: 'band', label: 'Data' }]}
                yAxis={[{ label: 'Quantidade' }]}
                series={[{ data: dadosGrafico.contagens, label: 'Atendimentos' }]}
              />
            </Box>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Soma de atendimentos por atendente (anel interno) e tipo de atendimento (anel externo) — {periodoSelecionadoLabel}
            </Typography>
            <Box sx={{ width: '100%', height: 380 }}>
              <PieChart
                series={[
                  {
                    data: dadosPizzaAtendente,
                    highlightScope: { highlight: 'item', fade: 'global' },
                    innerRadius: 50,
                    outerRadius: 90,
                    paddingAngle: 2,
                    cornerRadius: 4,
                  },
                  {
                    data: dadosPizzaTipoAtendimento,
                    highlightScope: { highlight: 'item', fade: 'global' },
                    innerRadius: 96,
                    outerRadius: 118,
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

