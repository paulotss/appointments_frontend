import AddIcon from '@mui/icons-material/Add'
import DownloadIcon from '@mui/icons-material/Download'
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess'
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TablePagination,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatAtendenteExibicao } from '../utils/formatAtendente'
import { CampoData } from '../components/CampoData'
import { RegistrosTable } from '../components/RegistrosTable'
import { getIsAdmin, getLoggedUser } from '../services/authStorage'
import { listarEspecialidades } from '../services/especialidades.service'
import {
  exportarRegistros,
  listarRegistros,
  type ContactMethodBackend,
} from '../services/registros.service'
import { listarUsuarios } from '../services/users.service'
import type { AppointmentListCounts, ListMeta } from '../types/listEnvelope'
import type { Especialidade, RegistroAtendimento, SimNao, TipoAtendimento } from '../types/registro'

const PAGE_SIZE_OPTIONS = [25, 50, 100]

const COUNTS_VAZIOS: AppointmentListCounts = {
  scheduledYes: 0,
  scheduledNo: 0,
  firstTimeYes: 0,
  firstTimeNo: 0,
  total: 0,
}

const META_VAZIA: ListMeta = {
  page: 1,
  limit: 50,
  total: 0,
  totalPages: 1,
}

function getHojeLocalISO(): string {
  const agora = new Date()
  const ano = agora.getFullYear()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function toDataHoraLocal(value: string): string {
  const data = new Date(value)
  if (Number.isNaN(data.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(data)
}

function escaparCampoCSV(valor: string | number | null | undefined): string {
  const texto = String(valor ?? '').replace(/"/g, '""')
  return `"${texto}"`
}

function normalizarPeriodo(dataInicio: string, dataFim: string) {
  return {
    from: dataInicio <= dataFim ? dataInicio : dataFim,
    to: dataFim >= dataInicio ? dataFim : dataInicio,
  }
}

function mapAtendimentoToContactMethod(
  atendimento: '' | TipoAtendimento,
): ContactMethodBackend | undefined {
  if (atendimento === 'telefone') {
    return 'phone'
  }
  if (atendimento === 'outro') {
    return 'other'
  }
  if (atendimento === 'whatsapp') {
    return 'whatsapp'
  }
  return undefined
}

function mapSimNaoToBoolean(value: '' | SimNao): boolean | undefined {
  if (value === 'sim') {
    return true
  }
  if (value === 'nao') {
    return false
  }
  return undefined
}

export function RegistrosPage() {
  const navigate = useNavigate()
  const isAdmin = getIsAdmin()
  const filtroDataPadrao = getHojeLocalISO()

  const [registros, setRegistros] = useState<RegistroAtendimento[]>([])
  const [counts, setCounts] = useState<AppointmentListCounts>(COUNTS_VAZIOS)
  const [meta, setMeta] = useState<ListMeta>(META_VAZIA)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(50)
  const [atendentes, setAtendentes] = useState<{ id: number; label: string }[]>([])
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [filtroDataInicio, setFiltroDataInicio] = useState(filtroDataPadrao)
  const [filtroDataFim, setFiltroDataFim] = useState(filtroDataPadrao)
  const [filtroAtendenteId, setFiltroAtendenteId] = useState('')
  const [filtroAtendimento, setFiltroAtendimento] = useState<'' | TipoAtendimento>('')
  const [filtroPrimeiraVez, setFiltroPrimeiraVez] = useState<'' | SimNao>('')
  const [filtroAgendamento, setFiltroAgendamento] = useState<'' | SimNao>('')
  const [filtroEspecialidade, setFiltroEspecialidade] = useState('')
  const [todosExpandidos, setTodosExpandidos] = useState(false)

  const montarFiltrosApi = useCallback(() => {
    const { from, to } = normalizarPeriodo(filtroDataInicio, filtroDataFim)
    return {
      from,
      to,
      ...(isAdmin && filtroAtendenteId
        ? { attendantId: Number(filtroAtendenteId) }
        : {}),
      ...(mapAtendimentoToContactMethod(filtroAtendimento)
        ? { contactMethod: mapAtendimentoToContactMethod(filtroAtendimento) }
        : {}),
      ...(mapSimNaoToBoolean(filtroPrimeiraVez) !== undefined
        ? { firstTime: mapSimNaoToBoolean(filtroPrimeiraVez) }
        : {}),
      ...(mapSimNaoToBoolean(filtroAgendamento) !== undefined
        ? { scheduled: mapSimNaoToBoolean(filtroAgendamento) }
        : {}),
      ...(filtroEspecialidade
        ? { specialtyId: Number(filtroEspecialidade) }
        : {}),
    }
  }, [
    filtroAgendamento,
    filtroAtendenteId,
    filtroAtendimento,
    filtroDataFim,
    filtroDataInicio,
    filtroEspecialidade,
    filtroPrimeiraVez,
    isAdmin,
  ])

  const resetPage = useCallback(() => {
    setPage(0)
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const especialidadesData = await listarEspecialidades()
        if (!cancelled) {
          setEspecialidades(especialidadesData)
        }
      } catch {
        // filtro de especialidade fica vazio se falhar
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isAdmin) {
      setAtendentes([])
      setFiltroAtendenteId('')
      return
    }

    let cancelled = false
    void (async () => {
      try {
        const usuariosData = await listarUsuarios()
        if (cancelled) {
          return
        }
        const opcoes = usuariosData
          .map((usuario) => ({
            id: usuario.id,
            label: formatAtendenteExibicao(usuario.name.trim(), usuario.extension),
          }))
          .filter((item) => item.label.length > 0)
          .sort((a, b) => a.label.localeCompare(b.label))
        setAtendentes(opcoes)

        const loggedUser = getLoggedUser()
        if (loggedUser && !filtroAtendenteId) {
          const existe = opcoes.some((item) => item.id === loggedUser.id)
          if (existe) {
            setFiltroAtendenteId(String(loggedUser.id))
          }
        }
      } catch {
        if (!cancelled) {
          setError('Nao foi possivel carregar os atendentes.')
        }
      }
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só na entrada admin
  }, [isAdmin])

  const carregar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await listarRegistros({
        ...montarFiltrosApi(),
        page: page + 1,
        limit: rowsPerPage,
      })
      setRegistros(result.data)
      setCounts(result.counts ?? COUNTS_VAZIOS)
      setMeta(result.meta)
    } catch {
      setError('Nao foi possivel carregar os registros.')
      setRegistros([])
      setCounts(COUNTS_VAZIOS)
      setMeta(META_VAZIA)
    } finally {
      setLoading(false)
    }
  }, [montarFiltrosApi, page, rowsPerPage])

  useEffect(() => {
    void carregar()
  }, [carregar])

  async function exportarCSV() {
    setExporting(true)
    setError(null)
    try {
      const registrosExport = await exportarRegistros(montarFiltrosApi())
      if (registrosExport.length === 0) {
        setError('Nenhum registro para exportar com os filtros atuais.')
        return
      }

      const cabecalho = [
        'ID',
        'Data',
        'Nome',
        'Telefone',
        'Atendimento',
        'Primeira vez',
        'Agendamento',
        'Motivo',
        'Especialidade',
        'Observacoes',
        'Atendente',
      ]

      const linhas = registrosExport.map((registro) =>
        [
          registro.id,
          toDataHoraLocal(registro.data),
          registro.nome,
          registro.telefone,
          registro.atendimento,
          registro.primeira_vez,
          registro.agendamento,
          registro.motivo,
          registro.especialidade_nome ?? '',
          registro.observacoes,
          registro.atendente,
        ]
          .map((campo) => escaparCampoCSV(campo))
          .join(';'),
      )

      const csv = [cabecalho.map((campo) => escaparCampoCSV(campo)).join(';'), ...linhas].join(
        '\r\n',
      )
      const csvComBOM = `\uFEFF${csv}`
      const blob = new Blob([csvComBOM], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const dataAtual = getHojeLocalISO()
      link.href = url
      link.setAttribute('download', `registros-${dataAtual}.csv`)
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('Nao foi possivel exportar os registros. Verifique o periodo/filtros.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <Stack spacing={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Registros de atendimentos
        </Typography>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={exporting ? <CircularProgress size={16} /> : <DownloadIcon />}
            onClick={() => void exportarCSV()}
            disabled={exporting || loading || meta.total === 0}
          >
            Exportar CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/registros/novo')}
          >
            Novo registro
          </Button>
        </Stack>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-start' }}>
        <CampoData
          label="Período inicial"
          size="small"
          value={filtroDataInicio}
          onChange={(next) => {
            setFiltroDataInicio(next)
            resetPage()
          }}
          sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 220 } }}
        />
        <CampoData
          label="Período final"
          size="small"
          value={filtroDataFim}
          onChange={(next) => {
            setFiltroDataFim(next)
            resetPage()
          }}
          sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 220 } }}
        />
        {isAdmin ? (
          <TextField
            select
            size="small"
            label="Filtrar por atendente"
            value={filtroAtendenteId}
            onChange={(event) => {
              setFiltroAtendenteId(event.target.value)
              resetPage()
            }}
            sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 220 } }}
          >
            <MenuItem value="">Todos</MenuItem>
            {atendentes.map((atendente) => (
              <MenuItem key={atendente.id} value={String(atendente.id)}>
                {atendente.label}
              </MenuItem>
            ))}
          </TextField>
        ) : null}
        <TextField
          select
          size="small"
          label="Atendimento"
          value={filtroAtendimento}
          onChange={(event) => {
            setFiltroAtendimento(event.target.value as '' | TipoAtendimento)
            resetPage()
          }}
          sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 160 } }}
        >
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="whatsapp">WhatsApp</MenuItem>
          <MenuItem value="telefone">Telefone</MenuItem>
          <MenuItem value="outro">Outro</MenuItem>
        </TextField>
        <TextField
          select
          size="small"
          label="1ª vez"
          value={filtroPrimeiraVez}
          onChange={(event) => {
            setFiltroPrimeiraVez(event.target.value as '' | SimNao)
            resetPage()
          }}
          sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 160 } }}
        >
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="sim">Sim ({counts.firstTimeYes})</MenuItem>
          <MenuItem value="nao">Não ({counts.firstTimeNo})</MenuItem>
        </TextField>
        <TextField
          select
          size="small"
          label="Agendamento"
          value={filtroAgendamento}
          onChange={(event) => {
            setFiltroAgendamento(event.target.value as '' | SimNao)
            resetPage()
          }}
          sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 160 } }}
        >
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="sim">Sim ({counts.scheduledYes})</MenuItem>
          <MenuItem value="nao">Não ({counts.scheduledNo})</MenuItem>
        </TextField>
        <TextField
          select
          size="small"
          label="Especialidade"
          value={filtroEspecialidade}
          onChange={(event) => {
            setFiltroEspecialidade(event.target.value)
            resetPage()
          }}
          sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 220 } }}
        >
          <MenuItem value="">Todas</MenuItem>
          {especialidades.map((especialidade) => (
            <MenuItem key={especialidade.id} value={String(especialidade.id)}>
              {especialidade.nome}
            </MenuItem>
          ))}
        </TextField>
        <Tooltip title={todosExpandidos ? 'Fechar tudo' : 'Abrir tudo'}>
          <span>
            <IconButton
              size="small"
              color="primary"
              onClick={() => setTodosExpandidos((prev) => !prev)}
              disabled={registros.length === 0}
              aria-label={todosExpandidos ? 'Fechar tudo' : 'Abrir tudo'}
              sx={{ mt: { xs: 0, sm: 0.5 } }}
            >
              {todosExpandidos ? (
                <UnfoldLessIcon fontSize="small" />
              ) : (
                <UnfoldMoreIcon fontSize="small" />
              )}
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {loading ? (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <CircularProgress size={20} />
          <Typography>Carregando registros...</Typography>
        </Stack>
      ) : null}

      {error ? <Alert severity="error">{error}</Alert> : null}

      {!loading ? (
        registros.length > 0 ? (
          <Paper sx={{ p: 0 }}>
            <RegistrosTable registros={registros} expandAll={todosExpandidos} />
            <TablePagination
              component="div"
              count={meta.total}
              page={page}
              onPageChange={(_, nextPage) => setPage(nextPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(Number(e.target.value))
                setPage(0)
              }}
              rowsPerPageOptions={PAGE_SIZE_OPTIONS}
              labelRowsPerPage="Por página"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}–${to} de ${count !== -1 ? count : `mais de ${to}`}`
              }
            />
          </Paper>
        ) : (
          <Paper sx={{ p: 3 }}>
            <Typography color="text.secondary">Nenhum registro encontrado.</Typography>
          </Paper>
        )
      ) : null}
    </Stack>
  )
}
