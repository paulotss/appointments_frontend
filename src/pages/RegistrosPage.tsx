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
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatAtendenteExibicao } from '../utils/formatAtendente'
import { RegistrosTable } from '../components/RegistrosTable'
import { getIsAdmin, getLoggedUser } from '../services/authStorage'
import { listarRegistros } from '../services/registros.service'
import { listarUsuarios } from '../services/users.service'
import type { RegistroAtendimento, SimNao } from '../types/registro'

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

export function RegistrosPage() {
  const navigate = useNavigate()
  const isAdmin = getIsAdmin()
  const usuarioLogado = getLoggedUser()
  const idUsuarioLogado =
    usuarioLogado != null && typeof usuarioLogado.id === 'number' && Number.isFinite(usuarioLogado.id)
      ? usuarioLogado.id
      : null
  const filtroDataPadrao = getHojeLocalISO()
  const [registros, setRegistros] = useState<RegistroAtendimento[]>([])
  const [usuarios, setUsuarios] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtroDataInicio, setFiltroDataInicio] = useState(filtroDataPadrao)
  const [filtroDataFim, setFiltroDataFim] = useState(filtroDataPadrao)
  /** Valor inicial vazio; apos carregar usuarios da API alinhamos ao rotulo exato das opcoes (ex.: nome | ramal). */
  const [filtroAtendente, setFiltroAtendente] = useState('')
  const [filtroPrimeiraVez, setFiltroPrimeiraVez] = useState<'' | SimNao>('')
  const [filtroAgendamento, setFiltroAgendamento] = useState<'' | SimNao>('')
  const [filtroEspecialidade, setFiltroEspecialidade] = useState('')
  const [todosExpandidos, setTodosExpandidos] = useState(false)

  useEffect(() => {
    async function carregarRegistros() {
      setLoading(true)
      setError(null)
      try {
        if (isAdmin) {
          const [registrosData, usuariosData] = await Promise.all([listarRegistros(), listarUsuarios()])
          setRegistros(registrosData)
          const nomesUsuarios = usuariosData
            .map((usuario) => formatAtendenteExibicao(usuario.name.trim(), usuario.extension))
            .filter((nome) => nome.length > 0)
            .sort((a, b) => a.localeCompare(b))
          const opcoesAtendentes = Array.from(new Set(nomesUsuarios))
          setUsuarios(opcoesAtendentes)

          const loggedUser = getLoggedUser()
          if (loggedUser) {
            const linhaUsuario = usuariosData.find((u) => u.id === loggedUser.id)
            const rotuloPreferido = linhaUsuario
              ? formatAtendenteExibicao(linhaUsuario.name.trim(), linhaUsuario.extension)
              : formatAtendenteExibicao(loggedUser.name.trim(), loggedUser.extension)
            if (opcoesAtendentes.includes(rotuloPreferido)) {
              setFiltroAtendente(rotuloPreferido)
            }
          }
        } else {
          const registrosData = await listarRegistros()
          setRegistros(registrosData)
          setUsuarios([])
          setFiltroAtendente('')
        }
      } catch {
        setError('Nao foi possivel carregar os registros.')
      } finally {
        setLoading(false)
      }
    }

    void carregarRegistros()
  }, [isAdmin])

  const atendentes = useMemo(() => {
    if (!isAdmin) {
      return []
    }
    if (usuarios.length > 0) {
      return usuarios
    }
    const unicos = Array.from(new Set(registros.map((registro) => registro.atendente)))
    return unicos.sort((a, b) => a.localeCompare(b))
  }, [isAdmin, registros, usuarios])

  const registrosVisiveis = useMemo(() => {
    if (isAdmin) {
      return registros
    }
    if (idUsuarioLogado == null) {
      return []
    }
    return registros.filter((registro) => registro.atendente_id === idUsuarioLogado)
  }, [idUsuarioLogado, isAdmin, registros])

  const especialidades = useMemo(() => {
    const map = new Map<number, string>()
    registrosVisiveis.forEach((registro) => {
      const nome = registro.especialidade_nome?.trim()
      if (nome) {
        map.set(registro.especialidade_id, nome)
      }
    })
    return Array.from(map.entries())
      .map(([id, nome]) => ({ id, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome))
  }, [registrosVisiveis])

  const registrosFiltrados = useMemo(() => {
    return registrosVisiveis.filter((registro) => {
      const dataRegistro = toDataLocalISO(registro.data)
      const dataOkInicio = !filtroDataInicio || dataRegistro >= filtroDataInicio
      const dataOkFim = !filtroDataFim || dataRegistro <= filtroDataFim
      const atendenteOk = !isAdmin || !filtroAtendente || registro.atendente === filtroAtendente
      const primeiraVezOk = !filtroPrimeiraVez || registro.primeira_vez === filtroPrimeiraVez
      const agendamentoOk = !filtroAgendamento || registro.agendamento === filtroAgendamento
      const especialidadeOk =
        !filtroEspecialidade || registro.especialidade_id === Number(filtroEspecialidade)
      return (
        dataOkInicio &&
        dataOkFim &&
        atendenteOk &&
        primeiraVezOk &&
        agendamentoOk &&
        especialidadeOk
      )
    })
  }, [
    filtroAgendamento,
    filtroAtendente,
    filtroDataFim,
    filtroDataInicio,
    filtroEspecialidade,
    filtroPrimeiraVez,
    isAdmin,
    registrosVisiveis,
  ])

  const exportarCSV = () => {
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

    const linhas = registrosFiltrados.map((registro) =>
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

    const csv = [cabecalho.map((campo) => escaparCampoCSV(campo)).join(';'), ...linhas].join('\r\n')
    const csvComBOM = `\uFEFF${csv}`
    const blob = new Blob([csvComBOM], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const dataAtual = getHojeLocalISO()
    link.href = url
    link.setAttribute('download', `registros-${dataAtual}.csv`)
    link.click()
    URL.revokeObjectURL(url)
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
            startIcon={<DownloadIcon />}
            onClick={exportarCSV}
            disabled={registrosFiltrados.length === 0}
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
        <TextField
          label="Período inicial"
          type="date"
          size="small"
          value={filtroDataInicio}
          onChange={(event) => setFiltroDataInicio(event.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 220 } }}
        />
        <TextField
          label="Período final"
          type="date"
          size="small"
          value={filtroDataFim}
          onChange={(event) => setFiltroDataFim(event.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 220 } }}
        />
        {isAdmin ? (
          <TextField
            select
            size="small"
            label="Filtrar por atendente"
            value={filtroAtendente}
            onChange={(event) => setFiltroAtendente(event.target.value)}
            sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 220 } }}
          >
            <MenuItem value="">Todos</MenuItem>
            {atendentes.map((atendente) => (
              <MenuItem key={atendente} value={atendente}>
                {atendente}
              </MenuItem>
            ))}
          </TextField>
        ) : null}
        <TextField
          select
          size="small"
          label="1ª vez"
          value={filtroPrimeiraVez}
          onChange={(event) => setFiltroPrimeiraVez(event.target.value as '' | SimNao)}
          sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 160 } }}
        >
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="sim">Sim</MenuItem>
          <MenuItem value="nao">Não</MenuItem>
        </TextField>
        <TextField
          select
          size="small"
          label="Agendamento"
          value={filtroAgendamento}
          onChange={(event) => setFiltroAgendamento(event.target.value as '' | SimNao)}
          sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 160 } }}
        >
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="sim">Sim</MenuItem>
          <MenuItem value="nao">Não</MenuItem>
        </TextField>
        <TextField
          select
          size="small"
          label="Especialidade"
          value={filtroEspecialidade}
          onChange={(event) => setFiltroEspecialidade(event.target.value)}
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
              disabled={registrosFiltrados.length === 0}
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

      {!loading && !error ? (
        registrosFiltrados.length > 0 ? (
          <Paper sx={{ p: 0 }}>
            <RegistrosTable registros={registrosFiltrados} expandAll={todosExpandidos} />
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
