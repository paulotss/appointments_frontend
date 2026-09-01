import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TablePagination,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { CampoValorMoeda } from '../components/CampoValorMoeda'
import { GuiasTable } from '../components/GuiasTable'
import { PacienteBuscaAutocomplete } from '../components/PacienteBuscaAutocomplete'
import { ProfissionalBuscaAutocomplete } from '../components/ProfissionalBuscaAutocomplete'
import { listarPlanosSaude } from '../services/health-plans.service'
import { buscarProfissional } from '../services/health-professionals.service'
import {
  atualizarGuia,
  excluirGuia,
  faturarGuia,
  listarGuias,
  listarTodasGuias,
} from '../services/insurance-guides.service'
import { buscarPaciente } from '../services/patients.service'
import { listarProcedimentos } from '../services/procedures.service'
import { valorFaturavelGuia } from '../types/financeiro'
import {
  guiaProcedimentosTotalmenteUtilizados,
  INSURANCE_GUIDE_STATUSES,
  INSURANCE_GUIDE_STATUS_LABELS,
  type InsuranceGuide,
  type InsuranceGuideStatus,
} from '../types/guia'
import type { ListMeta } from '../types/listEnvelope'
import type { Patient } from '../types/paciente'
import type { HealthPlan } from '../types/planoSaude'
import type { Procedure } from '../types/procedimento'
import { tissCodeDoPlano, valorDoPlano } from '../types/procedimento'
import type { HealthProfessional } from '../types/profissional'
import { mensagemErroApi } from '../utils/apiError'
import { adicionarDiasISO, statusPrazoGuia } from '../utils/dataISO'
import { formatarMoedaBRL, parseValorDecimal } from '../utils/moedaBRL'

const PAGE_SIZE_OPTIONS = [25, 50, 100]
const META_VAZIA: ListMeta = { page: 1, limit: 50, total: 0, totalPages: 1 }

function prazoDoPlano(guia: InsuranceGuide, planos: HealthPlan[]): number | undefined {
  return (
    guia.healthPlan?.submissionDeadlineDays ??
    planos.find((item) => item.id === guia.healthPlanId)?.submissionDeadlineDays
  )
}

function guiaAtendeFiltrosLocais(
  guia: InsuranceGuide,
  filtroMostrarFaturadas: boolean,
  filtroPertoVencer: boolean,
  filtroVencidas: boolean,
  filtroSemSaldo: boolean,
): boolean {
  if (guia.isBilled !== filtroMostrarFaturadas) return false
  if (filtroPertoVencer || filtroVencidas) {
    const prazo = statusPrazoGuia(guia.expirationDate)
    if (filtroPertoVencer && prazo !== 'proxima') return false
    if (filtroVencidas && prazo !== 'vencida') return false
  }
  if (filtroSemSaldo && !guiaProcedimentosTotalmenteUtilizados(guia.procedures)) return false
  return true
}

type ProcedimentoEdicao = {
  procedureId: number | ''
  authorizedQuantity: string
  usedQuantity: number
  value: number | undefined
}

export function GuiasPage() {
  const navigate = useNavigate()
  const [guias, setGuias] = useState<InsuranceGuide[]>([])
  const [planos, setPlanos] = useState<HealthPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loteFaturadoId, setLoteFaturadoId] = useState<number | null>(null)
  const [faturando, setFaturando] = useState<InsuranceGuide | null>(null)
  const [savingFaturar, setSavingFaturar] = useState(false)
  const [faturarError, setFaturarError] = useState<string | null>(null)
  const [editando, setEditando] = useState<InsuranceGuide | null>(null)
  const [pacienteEdicao, setPacienteEdicao] = useState<Patient | null>(null)
  const [profissionalEdicao, setProfissionalEdicao] = useState<HealthProfessional | null>(null)
  const [healthPlanIdEdicao, setHealthPlanIdEdicao] = useState<number | ''>('')
  const [statusEdicao, setStatusEdicao] = useState<InsuranceGuideStatus>('pending')
  const [guideNumberEdicao, setGuideNumberEdicao] = useState('')
  const [authorizationDateEdicao, setAuthorizationDateEdicao] = useState('')
  const [expirationDateEdicao, setExpirationDateEdicao] = useState('')
  const [procedimentosEdicao, setProcedimentosEdicao] = useState<ProcedimentoEdicao[]>([])
  const [procedimentosPlano, setProcedimentosPlano] = useState<Procedure[]>([])
  const [savingEdit, setSavingEdit] = useState(false)
  const [filtroPaciente, setFiltroPaciente] = useState<Patient | null>(null)
  const [filtroPlanoId, setFiltroPlanoId] = useState<number | ''>('')
  const [filtroStatus, setFiltroStatus] = useState<InsuranceGuideStatus | ''>('')
  const [filtroPertoVencer, setFiltroPertoVencer] = useState(false)
  const [filtroVencidas, setFiltroVencidas] = useState(false)
  const [filtroMostrarFaturadas, setFiltroMostrarFaturadas] = useState(false)
  const [filtroSemSaldo, setFiltroSemSaldo] = useState(false)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(50)
  const [meta, setMeta] = useState<ListMeta>(META_VAZIA)

  const patientIdEdicao = pacienteEdicao?.id ?? ''
  const healthProfessionalIdEdicao = profissionalEdicao?.id ?? ''

  const especialidadeIdsDoProfissional = useMemo(() => {
    return new Set((profissionalEdicao?.specialties ?? []).map((item) => item.specialtyId))
  }, [profissionalEdicao])

  const procedimentosElegiveis = useMemo(() => {
    if (especialidadeIdsDoProfissional.size === 0) return procedimentosPlano
    return procedimentosPlano.filter((item) => especialidadeIdsDoProfissional.has(item.specialtyId))
  }, [procedimentosPlano, especialidadeIdsDoProfissional])

  const prazoPlano =
    healthPlanIdEdicao === ''
      ? undefined
      : planos.find((item) => item.id === healthPlanIdEdicao)?.submissionDeadlineDays

  function recalcularValidade(authorizationDate: string, prazo: number | undefined) {
    if (prazo == null || !/^\d{4}-\d{2}-\d{2}$/.test(authorizationDate)) return
    setExpirationDateEdicao(adicionarDiasISO(authorizationDate, prazo))
  }

  function abrirEdicao(guia: InsuranceGuide) {
    const prazo = prazoDoPlano(guia, planos)
    setEditando(guia)
    setPacienteEdicao(
      guia.patient
        ? {
            id: guia.patient.id,
            name: guia.patient.name,
            phone: '',
            email: null,
            birthDate: null,
            cpf: null,
          }
        : null,
    )
    setProfissionalEdicao(null)
    setHealthPlanIdEdicao(guia.healthPlanId)
    setStatusEdicao(guia.status)
    setGuideNumberEdicao(guia.guideNumber ?? '')
    setExpirationDateEdicao(guia.expirationDate)
    setAuthorizationDateEdicao(
      guia.authorizationDate ||
        (prazo != null ? adicionarDiasISO(guia.expirationDate, -prazo) : ''),
    )
    setProcedimentosEdicao(
      guia.procedures.length > 0
        ? guia.procedures.map((item) => ({
            procedureId: item.procedureId,
            authorizedQuantity: String(item.authorizedQuantity),
            usedQuantity: item.usedQuantity,
            value: parseValorDecimal(item.value),
          }))
        : [{ procedureId: '', authorizedQuantity: '1', usedQuantity: 0, value: undefined }],
    )
    void buscarPaciente(guia.patientId)
      .then(setPacienteEdicao)
      .catch(() => undefined)
    void buscarProfissional(guia.healthProfessionalId)
      .then(setProfissionalEdicao)
      .catch(() => undefined)
  }

  function fecharEdicao() {
    setEditando(null)
    setPacienteEdicao(null)
    setProfissionalEdicao(null)
    setHealthPlanIdEdicao('')
    setStatusEdicao('pending')
    setGuideNumberEdicao('')
    setAuthorizationDateEdicao('')
    setExpirationDateEdicao('')
    setProcedimentosEdicao([])
    setProcedimentosPlano([])
  }

  async function salvarEdicao() {
    if (
      !editando ||
      patientIdEdicao === '' ||
      healthPlanIdEdicao === '' ||
      healthProfessionalIdEdicao === ''
    ) {
      return
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(authorizationDateEdicao)) {
      setError('Informe a data de autorização.')
      return
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expirationDateEdicao)) {
      setError('Informe a data de validade.')
      return
    }
    const procedures = procedimentosEdicao
      .filter((item) => item.procedureId !== '')
      .map((item) => ({
        procedureId: item.procedureId as number,
        authorizedQuantity: Number(item.authorizedQuantity),
        usedQuantity: item.usedQuantity,
        value: item.value,
      }))
    if (procedures.length < 1) {
      setError('Informe ao menos um procedimento.')
      return
    }
    if (new Set(procedures.map((item) => item.procedureId)).size !== procedures.length) {
      setError('Procedimentos duplicados não são permitidos.')
      return
    }
    if (procedures.some((item) => !Number.isInteger(item.authorizedQuantity) || item.authorizedQuantity < 1)) {
      setError('Quantidade autorizada deve ser um inteiro maior ou igual a 1.')
      return
    }
    if (procedures.some((item) => item.authorizedQuantity < item.usedQuantity)) {
      setError('A quantidade autorizada não pode ser menor que a quantidade já utilizada.')
      return
    }
    if (procedures.some((item) => item.value == null || Number.isNaN(item.value) || item.value < 0)) {
      setError('Informe o valor de cada procedimento.')
      return
    }
    setSavingEdit(true)
    setError(null)
    setSuccess(null)
    try {
      const atualizado = await atualizarGuia(editando.id, {
        patientId: patientIdEdicao,
        healthPlanId: healthPlanIdEdicao,
        healthProfessionalId: healthProfessionalIdEdicao,
        status: statusEdicao,
        guideNumber: guideNumberEdicao.trim() ? guideNumberEdicao.trim() : null,
        authorizationDate: authorizationDateEdicao,
        expirationDate: expirationDateEdicao,
        procedures: procedures.map((item) => ({
          procedureId: item.procedureId,
          authorizedQuantity: item.authorizedQuantity,
          value: item.value,
        })),
      })
      setGuias((prev) => prev.map((item) => (item.id === atualizado.id ? atualizado : item)))
      fecharEdicao()
      setSuccess('Guia atualizada com sucesso.')
      setLoteFaturadoId(null)
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível editar a guia.'))
    } finally {
      setSavingEdit(false)
    }
  }

  async function excluir(guia: InsuranceGuide) {
    const confirmou = window.confirm(
      `Confirma excluir a guia de ${guia.patient?.name ?? 'paciente'}?`,
    )
    if (!confirmou) return
    setError(null)
    setSuccess(null)
    try {
      await excluirGuia(guia.id)
      setGuias((prev) => prev.filter((item) => item.id !== guia.id))
      setSuccess('Guia excluída com sucesso.')
      setLoteFaturadoId(null)
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível excluir a guia.'))
    }
  }

  async function confirmarFaturar() {
    if (!faturando) return
    setSavingFaturar(true)
    setError(null)
    setSuccess(null)
    setFaturarError(null)
    setLoteFaturadoId(null)
    try {
      const lote = await faturarGuia(faturando.id)
      setGuias((prev) =>
        prev.map((item) =>
          item.id === faturando.id
            ? { ...item, isBilled: true, billingBatchId: lote.id }
            : item,
        ),
      )
      setFaturando(null)
      setLoteFaturadoId(lote.id)
      setSuccess('Guia faturada. A entrada financeira ficou pendente até o recebimento do plano.')
    } catch (err) {
      setFaturarError(mensagemErroApi(err, 'Não foi possível faturar a guia.'))
    } finally {
      setSavingFaturar(false)
    }
  }

  const authorizationDateInvalida = !/^\d{4}-\d{2}-\d{2}$/.test(authorizationDateEdicao)
  const expirationInvalida = !/^\d{4}-\d{2}-\d{2}$/.test(expirationDateEdicao)
  const proceduresInvalidos =
    procedimentosEdicao.length === 0 ||
    procedimentosEdicao.some((item) => {
      const qtd = Number(item.authorizedQuantity)
      return (
        item.procedureId === '' ||
        item.value == null ||
        Number.isNaN(item.value) ||
        item.value < 0 ||
        !Number.isInteger(qtd) ||
        qtd < 1 ||
        qtd < item.usedQuantity
      )
    }) ||
    new Set(procedimentosEdicao.map((item) => item.procedureId).filter((id) => id !== '')).size !==
      procedimentosEdicao.filter((item) => item.procedureId !== '').length
  const formInvalido =
    patientIdEdicao === '' ||
    healthPlanIdEdicao === '' ||
    healthProfessionalIdEdicao === '' ||
    proceduresInvalidos ||
    authorizationDateInvalida ||
    expirationInvalida

  const filtrosLocaisAtivos = filtroPertoVencer || filtroVencidas || filtroSemSaldo || filtroMostrarFaturadas

  const paramsApi = useMemo(
    () => ({
      ...(filtroPaciente ? { patientId: filtroPaciente.id } : {}),
      ...(filtroPlanoId === '' ? {} : { healthPlanId: filtroPlanoId }),
      ...(filtroStatus === '' ? {} : { status: filtroStatus }),
    }),
    [filtroPaciente, filtroPlanoId, filtroStatus],
  )

  const guiasFiltradas = useMemo(() => {
    return guias.filter((guia) =>
      guiaAtendeFiltrosLocais(
        guia,
        filtroMostrarFaturadas,
        filtroPertoVencer,
        filtroVencidas,
        filtroSemSaldo,
      ),
    )
  }, [guias, filtroMostrarFaturadas, filtroPertoVencer, filtroVencidas, filtroSemSaldo])

  const totalExibido = filtrosLocaisAtivos ? guiasFiltradas.length : meta.total
  const ultimaPagina = Math.max(0, Math.ceil(totalExibido / rowsPerPage) - 1)
  const pageSegura = Math.min(page, ultimaPagina)
  const guiasExibidas = useMemo(() => {
    if (!filtrosLocaisAtivos) return guiasFiltradas
    const inicio = pageSegura * rowsPerPage
    return guiasFiltradas.slice(inicio, inicio + rowsPerPage)
  }, [filtrosLocaisAtivos, guiasFiltradas, pageSegura, rowsPerPage])

  const paginaServidor = filtrosLocaisAtivos ? null : page
  const limiteServidor = filtrosLocaisAtivos ? null : rowsPerPage

  useEffect(() => {
    let cancelado = false
    async function carregar() {
      setLoading(true)
      setError(null)
      try {
        if (paginaServidor == null || limiteServidor == null) {
          const todas = await listarTodasGuias(paramsApi)
          if (!cancelado) setGuias(todas)
          return
        }
        const resultado = await listarGuias({
          page: paginaServidor + 1,
          limit: limiteServidor,
          ...paramsApi,
        })
        if (!cancelado) {
          setGuias(resultado.data)
          setMeta(resultado.meta)
        }
      } catch (err) {
        if (!cancelado) setError(mensagemErroApi(err, 'Não foi possível carregar as guias.'))
      } finally {
        if (!cancelado) setLoading(false)
      }
    }
    void carregar()
    return () => {
      cancelado = true
    }
  }, [paramsApi, paginaServidor, limiteServidor])

  useEffect(() => {
    async function carregarPlanos() {
      try {
        setPlanos(await listarPlanosSaude())
      } catch {
        /* filtros de plano ficam vazios */
      }
    }
    void carregarPlanos()
  }, [])

  useEffect(() => {
    setPage(0)
  }, [filtroPaciente, filtroPlanoId, filtroStatus, filtroPertoVencer, filtroVencidas, filtroMostrarFaturadas, filtroSemSaldo])

  useEffect(() => {
    if (page > ultimaPagina) setPage(ultimaPagina)
  }, [page, ultimaPagina])

  useEffect(() => {
    async function carregarProcedimentos() {
      if (healthPlanIdEdicao === '') {
        setProcedimentosPlano([])
        return
      }
      try {
        const data = await listarProcedimentos({ healthPlanId: healthPlanIdEdicao })
        setProcedimentosPlano(data)
      } catch {
        setProcedimentosPlano([])
      }
    }
    if (editando) {
      void carregarProcedimentos()
    }
  }, [healthPlanIdEdicao, editando])

  useEffect(() => {
    if (healthPlanIdEdicao === '') return
    setProcedimentosEdicao((prev) =>
      prev.map((row) => {
        if (row.procedureId === '' || (row.value != null && !Number.isNaN(row.value))) return row
        const proc = procedimentosPlano.find((item) => item.id === row.procedureId)
        const preco = valorDoPlano(proc, healthPlanIdEdicao)
        return preco == null ? row : { ...row, value: preco }
      }),
    )
  }, [healthPlanIdEdicao, procedimentosPlano])

  return (
    <Stack spacing={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Guias
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/guias/novo')}>
          Nova guia
        </Button>
      </Box>

      {loading ? (
        <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress size={20} />
          <Typography>Carregando guias...</Typography>
        </Paper>
      ) : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
      {success ? (
        <Alert severity="success">
          {success}
          {loteFaturadoId != null ? (
            <>
              {' '}
              <RouterLink to={`/tiss/lotes/${loteFaturadoId}`}>Ver lote #{loteFaturadoId}</RouterLink>
            </>
          ) : null}
        </Alert>
      ) : null}

      {!loading && !error ? (
        <Stack spacing={1.5}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
            <PacienteBuscaAutocomplete
              value={filtroPaciente}
              onChange={setFiltroPaciente}
              size="small"
              fullWidth
              sx={{ flex: 1, minWidth: { xs: '100%', md: 280 } }}
            />
            <Autocomplete
              options={planos}
              getOptionLabel={(plano) => plano.name}
              isOptionEqualToValue={(option, selected) => option.id === selected.id}
              value={planos.find((plano) => plano.id === filtroPlanoId) ?? null}
              onChange={(_, plano) => setFiltroPlanoId(plano?.id ?? '')}
              sx={{ minWidth: { xs: '100%', md: 240 }, flex: { md: 1 } }}
              renderInput={(params) => (
                <TextField {...params} label="Plano de saúde" size="small" placeholder="Todos" />
              )}
            />
            <TextField
              select
              size="small"
              label="Status"
              value={filtroStatus}
              onChange={(event) => setFiltroStatus(event.target.value as InsuranceGuideStatus | '')}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="">Todos</MenuItem>
              {INSURANCE_GUIDE_STATUSES.map((status) => (
                <MenuItem key={status} value={status}>
                  {INSURANCE_GUIDE_STATUS_LABELS[status]}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
            <FormControlLabel
              control={
                <Switch
                  checked={filtroPertoVencer}
                  onChange={(_, checked) => {
                    setFiltroPertoVencer(checked)
                    if (checked) setFiltroVencidas(false)
                    setPage(0)
                  }}
                />
              }
              label="Perto de vencer (7 dias)"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={filtroVencidas}
                  onChange={(_, checked) => {
                    setFiltroVencidas(checked)
                    if (checked) setFiltroPertoVencer(false)
                    setPage(0)
                  }}
                />
              }
              label="Somente vencidas"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={filtroMostrarFaturadas}
                  onChange={(_, checked) => {
                    setFiltroMostrarFaturadas(checked)
                    setPage(0)
                  }}
                />
              }
              label="Mostrar faturadas"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={filtroSemSaldo}
                  onChange={(_, checked) => {
                    setFiltroSemSaldo(checked)
                    setPage(0)
                  }}
                />
              }
              label="Sem saldo"
            />
          </Stack>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 12, height: 12, bgcolor: 'success.light', borderRadius: 0.5 }} />
              Faturada
            </Typography>
            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 12, height: 12, bgcolor: 'warning.light', borderRadius: 0.5 }} />
              Faltam até 7 dias
            </Typography>
            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 12, height: 12, bgcolor: 'error.light', borderRadius: 0.5 }} />
              Último dia de validade / Vencida
            </Typography>
          </Stack>
        </Stack>
      ) : null}

      {!loading && !error && guias.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography>Nenhuma guia encontrada.</Typography>
        </Paper>
      ) : null}

      {!loading && !error && guias.length > 0 && guiasFiltradas.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography>Nenhuma guia encontrada para os filtros selecionados.</Typography>
        </Paper>
      ) : null}

      {!loading && !error && guiasFiltradas.length > 0 ? (
        <Paper sx={{ p: 0 }}>
          <GuiasTable
            guias={guiasExibidas}
            onEditar={abrirEdicao}
            onExcluir={(guia) => void excluir(guia)}
            onFaturar={(guia) => {
              setFaturarError(null)
              setFaturando(guia)
            }}
          />
          <TablePagination
            component="div"
            count={totalExibido}
            page={pageSegura}
            onPageChange={(_, nextPage) => setPage(nextPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(Number(event.target.value))
              setPage(0)
            }}
            rowsPerPageOptions={PAGE_SIZE_OPTIONS}
            labelRowsPerPage="Por página"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to} de ${count !== -1 ? count : `mais de ${to}`}`
            }
          />
        </Paper>
      ) : null}

      <Dialog open={Boolean(editando)} onClose={fecharEdicao} fullWidth maxWidth="md">
        <DialogTitle>Editar guia</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 0.5 }}>
            <PacienteBuscaAutocomplete
              value={pacienteEdicao}
              onChange={setPacienteEdicao}
              error={patientIdEdicao === ''}
              helperText={patientIdEdicao === '' ? 'Selecione o paciente' : ' '}
            />
            <Autocomplete
              options={planos}
              getOptionLabel={(plano) => plano.name}
              isOptionEqualToValue={(option, selected) => option.id === selected.id}
              value={planos.find((plano) => plano.id === healthPlanIdEdicao) ?? null}
              onChange={(_, plano) => {
                setHealthPlanIdEdicao(plano?.id ?? '')
                if (plano) recalcularValidade(authorizationDateEdicao, plano.submissionDeadlineDays)
                setProcedimentosEdicao((prev) => prev.map((row) => ({ ...row, value: undefined })))
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Plano de saúde"
                  error={healthPlanIdEdicao === ''}
                  helperText={healthPlanIdEdicao === '' ? 'Selecione o plano de saúde' : ' '}
                />
              )}
            />
            <ProfissionalBuscaAutocomplete
              value={profissionalEdicao}
              onChange={setProfissionalEdicao}
              somenteAtivos
              error={healthProfessionalIdEdicao === ''}
              helperText={healthProfessionalIdEdicao === '' ? 'Selecione o profissional' : ' '}
            />
            <TextField
              select
              label="Status"
              value={statusEdicao}
              onChange={(event) => setStatusEdicao(event.target.value as InsuranceGuideStatus)}
            >
              {INSURANCE_GUIDE_STATUSES.map((status) => (
                <MenuItem key={status} value={status}>
                  {INSURANCE_GUIDE_STATUS_LABELS[status]}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Número da guia"
              value={guideNumberEdicao}
              onChange={(event) => setGuideNumberEdicao(event.target.value)}
              helperText="Opcional"
            />
            <TextField
              label="Data de autorização"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={authorizationDateEdicao}
              onChange={(event) => {
                const next = event.target.value
                setAuthorizationDateEdicao(next)
                recalcularValidade(next, prazoPlano)
              }}
              error={authorizationDateInvalida}
              helperText={authorizationDateInvalida ? 'Informe a data de autorização' : ' '}
            />
            <TextField
              label="Data de validade"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={expirationDateEdicao}
              onChange={(event) => setExpirationDateEdicao(event.target.value)}
              error={expirationInvalida}
              helperText={
                expirationInvalida
                  ? 'Informe a data de validade'
                  : prazoPlano != null
                    ? `Sugestão: data de autorização + prazo do plano (${prazoPlano} dias). Pode ser alterada.`
                    : ' '
              }
            />

            <Typography variant="subtitle2" fontWeight={700}>
              Procedimentos
            </Typography>
            {procedimentosEdicao.map((item, index) => {
              const selecionados = procedimentosEdicao
                .map((row, rowIndex) => (rowIndex === index ? undefined : row.procedureId))
                .filter((id): id is number => typeof id === 'number')
              const opcoes = procedimentosElegiveis.filter(
                (proc) => !selecionados.includes(proc.id) || proc.id === item.procedureId,
              )
              const qtd = Number(item.authorizedQuantity)
              const qtdInvalida = !Number.isInteger(qtd) || qtd < 1 || qtd < item.usedQuantity
              const podeRemover = item.usedQuantity === 0

              return (
                <Stack key={`${item.procedureId}-${index}`} direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <TextField
                    select
                    label="Procedimento"
                    value={item.procedureId}
                    onChange={(event) => {
                      const value = Number(event.target.value)
                      const proc = opcoes.find((item) => item.id === value)
                      const preco =
                        healthPlanIdEdicao === '' ? undefined : valorDoPlano(proc, healthPlanIdEdicao)
                      setProcedimentosEdicao((prev) =>
                        prev.map((row, rowIndex) =>
                          rowIndex === index
                            ? { ...row, procedureId: value, value: preco }
                            : row,
                        ),
                      )
                    }}
                    error={item.procedureId === ''}
                    helperText={item.procedureId === '' ? 'Selecione o procedimento' : ' '}
                    sx={{ flex: 1, minWidth: 220 }}
                    disabled={item.usedQuantity > 0}
                  >
                    <MenuItem value="" disabled>
                      Selecione
                    </MenuItem>
                    {opcoes.map((proc) => {
                      const tiss =
                        healthPlanIdEdicao === '' ? undefined : tissCodeDoPlano(proc, healthPlanIdEdicao)
                      return (
                        <MenuItem key={proc.id} value={proc.id}>
                          {tiss ? `${proc.name} (${tiss})` : proc.name}
                        </MenuItem>
                      )
                    })}
                  </TextField>
                  <TextField
                    label="Autorizado"
                    type="number"
                    inputProps={{ min: Math.max(1, item.usedQuantity), step: 1 }}
                    value={item.authorizedQuantity}
                    onChange={(event) => {
                      const value = event.target.value
                      setProcedimentosEdicao((prev) =>
                        prev.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, authorizedQuantity: value } : row,
                        ),
                      )
                    }}
                    error={qtdInvalida}
                    helperText={
                      qtdInvalida
                        ? item.usedQuantity > 0
                          ? `Mínimo ${item.usedQuantity} (já utilizado)`
                          : 'Informe um inteiro ≥ 1'
                        : ' '
                    }
                    sx={{ width: { xs: '100%', sm: 140 } }}
                  />
                  <CampoValorMoeda
                    label="Valor"
                    value={item.value}
                    onChange={(value) => {
                      setProcedimentosEdicao((prev) =>
                        prev.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, value } : row,
                        ),
                      )
                    }}
                    error={item.value == null || Number.isNaN(item.value) || item.value < 0}
                    helperText={
                      item.value == null || Number.isNaN(item.value) || item.value < 0
                        ? 'Informe o valor'
                        : ' '
                    }
                  />
                  <TextField
                    label="Utilizado"
                    value={item.usedQuantity}
                    InputProps={{ readOnly: true }}
                    sx={{ width: { xs: '100%', sm: 120 } }}
                  />
                  <TextField
                    label="Saldo"
                    value={Math.max(0, (Number.isFinite(qtd) ? qtd : 0) - item.usedQuantity)}
                    InputProps={{ readOnly: true }}
                    sx={{ width: { xs: '100%', sm: 120 } }}
                  />
                  <IconButton
                    aria-label="Remover procedimento"
                    onClick={() =>
                      setProcedimentosEdicao((prev) => prev.filter((_, rowIndex) => rowIndex !== index))
                    }
                    disabled={!podeRemover || procedimentosEdicao.length === 1}
                    sx={{ mt: 0.5 }}
                    title={
                      !podeRemover
                        ? 'Não é possível remover procedimento com quantidade utilizada'
                        : 'Remover'
                    }
                  >
                    <DeleteOutlineIcon />
                  </IconButton>
                </Stack>
              )
            })}
            <Button
              type="button"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() =>
                setProcedimentosEdicao((prev) => [
                  ...prev,
                  { procedureId: '', authorizedQuantity: '1', usedQuantity: 0, value: undefined },
                ])
              }
              sx={{ alignSelf: 'flex-start' }}
            >
              Adicionar procedimento
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={fecharEdicao}>Cancelar</Button>
          <Button onClick={() => void salvarEdicao()} variant="contained" disabled={savingEdit || formInvalido}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(faturando)}
        onClose={() => {
          if (savingFaturar) return
          setFaturando(null)
          setFaturarError(null)
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Faturar guia</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 0.5 }}>
            {faturarError ? <Alert severity="error">{faturarError}</Alert> : null}
            <Alert severity="warning">
              Confirma o faturamento desta guia
              {faturando ? ` de ${faturando.patient?.name ?? 'paciente'}` : ''}
              {faturando
                ? ` no valor de ${formatarMoedaBRL(valorFaturavelGuia(faturando.procedures))}`
                : ''}
              ? A guia será marcada como faturada, um lote TISS será criado e uma entrada financeira
              pendente será gerada. O recebimento do plano (e eventuais glosas) poderá ser registrado
              depois no lote.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setFaturando(null)
              setFaturarError(null)
            }}
            disabled={savingFaturar}
          >
            Cancelar
          </Button>
          <Button variant="contained" onClick={() => void confirmarFaturar()} disabled={savingFaturar}>
            {savingFaturar ? 'Faturando...' : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
