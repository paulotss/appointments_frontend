import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditIcon from '@mui/icons-material/Edit'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CampoData } from '../components/CampoData'
import { CampoValorMoeda } from '../components/CampoValorMoeda'
import { GuiaProcedimentosTabela } from '../components/GuiaProcedimentosTabela'
import { PacienteBuscaAutocomplete } from '../components/PacienteBuscaAutocomplete'
import { ProfissionalBuscaAutocomplete } from '../components/ProfissionalBuscaAutocomplete'
import {
  atualizarAgendamentoClinico,
  criarAgendamentoClinico,
  excluirAgendamentoClinico,
  listarAgendamentosClinicos,
} from '../services/clinical-appointments.service'
import { buscarProfissional } from '../services/health-professionals.service'
import {
  atualizarGuia,
  buscarGuia,
  excluirGuia,
} from '../services/insurance-guides.service'
import { listarTodosLotesTiss, criarLoteTiss, atualizarLoteTiss } from '../services/billing-batches.service'
import { buscarPaciente } from '../services/patients.service'
import { listarProcedimentos } from '../services/procedures.service'
import { listarPlanosSaude } from '../services/health-plans.service'
import {
  CLINICAL_APPOINTMENT_STATUSES,
  CLINICAL_APPOINTMENT_STATUS_LABELS,
  type ClinicalAppointment,
  type ClinicalAppointmentStatus,
} from '../types/agendamentoClinico'
import { valorFaturavelGuia, type BillingBatch } from '../types/financeiro'
import {
  guiaElegivelParaFaturar,
  INSURANCE_GUIDE_STATUSES,
  INSURANCE_GUIDE_STATUS_LABELS,
  type InsuranceGuide,
  type InsuranceGuideStatus,
} from '../types/guia'
import type { HealthPlan } from '../types/planoSaude'
import type { Procedure } from '../types/procedimento'
import { tissCodeDoPlano, valorDoPlano } from '../types/procedimento'
import type { Patient } from '../types/paciente'
import type { HealthProfessional } from '../types/profissional'
import { TISS_GUIDE_TYPE_LABELS } from '../types/tiss'
import { mensagemConflitoNumeroGuia, mensagemErroApi } from '../utils/apiError'
import { adicionarDiasISO, formatarDataISO, hojeLocalISO } from '../utils/dataISO'
import { formatarMoedaBRL, parseValorDecimal } from '../utils/moedaBRL'
import {
  adicionarMinutosIso,
  dataHoraSaoPauloParaIso,
  duracaoMinutosEntre,
  formatarDataHoraSaoPaulo,
  formatarHoraSaoPaulo,
  isoParaHmSaoPaulo,
  isoParaYmdSaoPaulo,
} from '../utils/dataHoraSaoPaulo'
import {
  agendamentoReservaSaldoGuia,
  guiaTemSaldoLivreParaAgendamento,
  motivoBloqueioFinalizado,
  reservasPorGuiaAPartirDeIds,
  saldoDisponivelGuia,
} from '../utils/saldoGuia'

type ProcedimentoEdicao = {
  procedureId: number | ''
  authorizedQuantity: string
  usedQuantity: number
  value: number | undefined
}

function prazoDoPlano(guia: InsuranceGuide, planos: HealthPlan[]): number | undefined {
  return (
    guia.healthPlan?.submissionDeadlineDays ??
    planos.find((item) => item.id === guia.healthPlanId)?.submissionDeadlineDays
  )
}

function corChipStatusGuia(status: InsuranceGuideStatus) {
  if (status === 'pending') {
    return { bgcolor: 'error.light', color: '#fff' }
  }
  if (status === 'under_analysis') {
    return { bgcolor: 'warning.main', color: 'warning.contrastText' }
  }
  if (status === 'authorized') {
    return { bgcolor: 'success.main', color: 'success.contrastText' }
  }
  return undefined
}

function ChipSaldoGuia({ saldo }: { saldo: number }) {
  return (
    <Chip
      size="small"
      label={saldo}
      color={saldo > 0 ? 'primary' : 'default'}
    />
  )
}

export function GuiaDetalhePage() {
  const navigate = useNavigate()
  const { id: idParam } = useParams<{ id: string }>()
  const id = idParam != null && idParam !== '' ? Number.parseInt(idParam, 10) : Number.NaN

  const [guia, setGuia] = useState<InsuranceGuide | null>(null)
  const [agendamentos, setAgendamentos] = useState<ClinicalAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [scheduledDate, setScheduledDate] = useState(hojeLocalISO)
  const [scheduledTime, setScheduledTime] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('30')
  const [saving, setSaving] = useState(false)

  // ── Edição da guia ──────────────────────────────────────────────
  const [planos, setPlanos] = useState<HealthPlan[]>([])
  const [editandoGuia, setEditandoGuia] = useState<InsuranceGuide | null>(null)
  const [pacienteEdicao, setPacienteEdicao] = useState<Patient | null>(null)
  const [profissionalEdicao, setProfissionalEdicao] = useState<HealthProfessional | null>(null)
  const [healthPlanIdEdicao, setHealthPlanIdEdicao] = useState<number | ''>('')
  const [statusEdicaoGuia, setStatusEdicaoGuia] = useState<InsuranceGuideStatus>('pending')
  const [guideNumberEdicao, setGuideNumberEdicao] = useState('')
  const [guideNumberEdicaoError, setGuideNumberEdicaoError] = useState<string | null>(null)
  const [authorizationDateEdicao, setAuthorizationDateEdicao] = useState('')
  const [expirationDateEdicao, setExpirationDateEdicao] = useState('')
  const [procedimentosEdicao, setProcedimentosEdicao] = useState<ProcedimentoEdicao[]>([])
  const [procedimentosPlano, setProcedimentosPlano] = useState<Procedure[]>([])
  const [savingEditGuia, setSavingEditGuia] = useState(false)
  const [editGuiaError, setEditGuiaError] = useState<string | null>(null)

  // ── Faturamento da guia ─────────────────────────────────────────
  const [faturando, setFaturando] = useState<InsuranceGuide | null>(null)
  const [savingFaturar, setSavingFaturar] = useState(false)
  const [faturarError, setFaturarError] = useState<string | null>(null)
  const [faturarModo, setFaturarModo] = useState<'novo' | 'existente'>('novo')
  const [lotesAbertos, setLotesAbertos] = useState<BillingBatch[]>([])
  const [loteSelecionadoId, setLoteSelecionadoId] = useState<number | null>(null)
  const [loadingLotes, setLoadingLotes] = useState(false)

  // ── Edição do agendamento ───────────────────────────────────────
  const [editando, setEditando] = useState<ClinicalAppointment | null>(null)
  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')
  const [editDuration, setEditDuration] = useState('30')
  const [editStatus, setEditStatus] = useState<ClinicalAppointmentStatus>('marked')
  const [editNotes, setEditNotes] = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)

  const carregar = useCallback(async () => {
    if (!Number.isFinite(id)) {
      setLoading(false)
      setError('Identificador da guia inválido.')
      setGuia(null)
      setAgendamentos([])
      return
    }

    setLoading(true)
    setError(null)
    try {
      const [guiaCarregada, agendamentosCarregados] = await Promise.all([
        buscarGuia(id),
        listarAgendamentosClinicos({ insuranceGuideId: id }),
      ])
      setGuia(guiaCarregada)
      setAgendamentos(agendamentosCarregados)
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível carregar a guia.'))
      setGuia(null)
      setAgendamentos([])
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void carregar()
  }, [carregar])

  useEffect(() => {
    listarPlanosSaude()
      .then(setPlanos)
      .catch(() => undefined)
  }, [])

  // ── Derived da edição de guia ────────────────────────────────────
  const patientIdEdicao = pacienteEdicao?.id ?? ''
  const healthProfessionalIdEdicao = profissionalEdicao?.id ?? ''

  const especialidadeIdsDoProfissional = useMemo(
    () => new Set((profissionalEdicao?.specialties ?? []).map((item) => item.specialtyId)),
    [profissionalEdicao],
  )

  const procedimentosElegiveis = useMemo(
    () =>
      especialidadeIdsDoProfissional.size === 0
        ? procedimentosPlano
        : procedimentosPlano.filter((item) => especialidadeIdsDoProfissional.has(item.specialtyId)),
    [procedimentosPlano, especialidadeIdsDoProfissional],
  )

  const prazoPlanoEdicao =
    healthPlanIdEdicao === ''
      ? undefined
      : planos.find((item) => item.id === healthPlanIdEdicao)?.submissionDeadlineDays

  useEffect(() => {
    async function carregarProcedimentos() {
      if (!editandoGuia || healthPlanIdEdicao === '') {
        setProcedimentosPlano([])
        return
      }
      try {
        setProcedimentosPlano(await listarProcedimentos({ healthPlanId: healthPlanIdEdicao }))
      } catch {
        setProcedimentosPlano([])
      }
    }
    void carregarProcedimentos()
  }, [healthPlanIdEdicao, editandoGuia])

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

  // ── Carregar lotes abertos ao abrir dialog de faturamento ────────
  useEffect(() => {
    if (!faturando) {
      setLotesAbertos([])
      setLoteSelecionadoId(null)
      setFaturarModo('novo')
      setLoadingLotes(false)
      return
    }
    const guiaFaturar = faturando
    let cancelado = false
    setLoadingLotes(true)
    setFaturarError(null)
    setLoteSelecionadoId(null)
    setFaturarModo('novo')
    listarTodosLotesTiss({ healthPlanId: guiaFaturar.healthPlanId, status: 'open' })
      .then((lotes) => { if (!cancelado) setLotesAbertos(lotes) })
      .catch((err) => { if (!cancelado) setFaturarError(mensagemErroApi(err, 'Não foi possível carregar os lotes abertos.')) })
      .finally(() => { if (!cancelado) setLoadingLotes(false) })
    return () => { cancelado = true }
  }, [faturando])

  // ── Funções guia: editar, faturar, excluir ───────────────────────
  function recalcularValidade(authorizationDate: string, prazo: number | undefined) {
    if (prazo == null || !/^\d{4}-\d{2}-\d{2}$/.test(authorizationDate)) return
    setExpirationDateEdicao(adicionarDiasISO(authorizationDate, prazo))
  }

  function abrirEditarGuia(g: InsuranceGuide) {
    const prazo = prazoDoPlano(g, planos)
    setEditandoGuia(g)
    setPacienteEdicao(
      g.patient
        ? { id: g.patient.id, name: g.patient.name, phone: '', email: null, birthDate: null, cpf: null, insuranceCards: [] }
        : null,
    )
    setProfissionalEdicao(null)
    setHealthPlanIdEdicao(g.healthPlanId)
    setStatusEdicaoGuia(g.status)
    setGuideNumberEdicao(g.guideNumber ?? '')
    setGuideNumberEdicaoError(null)
    setExpirationDateEdicao(g.expirationDate)
    setAuthorizationDateEdicao(
      g.authorizationDate || (prazo != null ? adicionarDiasISO(g.expirationDate, -prazo) : ''),
    )
    setProcedimentosEdicao(
      g.procedures.length > 0
        ? g.procedures.map((item) => ({
            procedureId: item.procedureId,
            authorizedQuantity: String(item.authorizedQuantity),
            usedQuantity: item.usedQuantity,
            value: parseValorDecimal(item.value),
          }))
        : [{ procedureId: '', authorizedQuantity: '1', usedQuantity: 0, value: undefined }],
    )
    setEditGuiaError(null)
    void buscarPaciente(g.patientId).then(setPacienteEdicao).catch(() => undefined)
    void buscarProfissional(g.healthProfessionalId).then(setProfissionalEdicao).catch(() => undefined)
  }

  function fecharEditarGuia() {
    if (savingEditGuia) return
    setEditandoGuia(null)
    setPacienteEdicao(null)
    setProfissionalEdicao(null)
    setHealthPlanIdEdicao('')
    setStatusEdicaoGuia('pending')
    setGuideNumberEdicao('')
    setGuideNumberEdicaoError(null)
    setAuthorizationDateEdicao('')
    setExpirationDateEdicao('')
    setProcedimentosEdicao([])
    setProcedimentosPlano([])
    setEditGuiaError(null)
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
    new Set(procedimentosEdicao.map((item) => item.procedureId).filter((pid) => pid !== '')).size !==
      procedimentosEdicao.filter((item) => item.procedureId !== '').length
  const guiaFormInvalido =
    patientIdEdicao === '' ||
    healthPlanIdEdicao === '' ||
    healthProfessionalIdEdicao === '' ||
    proceduresInvalidos ||
    authorizationDateInvalida ||
    expirationInvalida

  async function salvarEdicaoGuia() {
    if (!editandoGuia || guiaFormInvalido) return
    const procedures = procedimentosEdicao
      .filter((item) => item.procedureId !== '')
      .map((item) => ({
        procedureId: item.procedureId as number,
        authorizedQuantity: Number(item.authorizedQuantity),
        value: item.value,
      }))
    setSavingEditGuia(true)
    setEditGuiaError(null)
    setError(null)
    setSuccess(null)
    setGuideNumberEdicaoError(null)
    try {
      const atualizado = await atualizarGuia(editandoGuia.id, {
        patientId: patientIdEdicao as number,
        healthPlanId: healthPlanIdEdicao as number,
        healthProfessionalId: healthProfessionalIdEdicao as number,
        status: statusEdicaoGuia,
        guideNumber: guideNumberEdicao.trim() ? guideNumberEdicao.trim() : null,
        authorizationDate: authorizationDateEdicao,
        expirationDate: expirationDateEdicao,
        procedures,
      })
      setGuia(atualizado)
      fecharEditarGuia()
      setSuccess('Guia atualizada com sucesso.')
    } catch (err) {
      const conflito = mensagemConflitoNumeroGuia(err)
      if (conflito) setGuideNumberEdicaoError(conflito)
      setEditGuiaError(mensagemErroApi(err, 'Não foi possível editar a guia.'))
    } finally {
      setSavingEditGuia(false)
    }
  }

  async function excluirGuiaDetalhe() {
    if (!guia) return
    const confirmou = window.confirm(`Confirma excluir a guia de ${guia.patient?.name ?? 'paciente'}?`)
    if (!confirmou) return
    setError(null)
    setSuccess(null)
    try {
      await excluirGuia(guia.id)
      navigate('/guias', { replace: true })
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível excluir a guia.'))
    }
  }

  async function confirmarFaturar() {
    if (!faturando) return
    if (faturarModo === 'existente' && loteSelecionadoId == null) {
      setFaturarError('Selecione um lote existente.')
      return
    }
    setSavingFaturar(true)
    setFaturarError(null)
    setError(null)
    setSuccess(null)
    try {
      const lote =
        faturarModo === 'novo'
          ? await criarLoteTiss({ healthPlanId: faturando.healthPlanId, insuranceGuideIds: [faturando.id] })
          : await atualizarLoteTiss(loteSelecionadoId!, { addInsuranceGuideIds: [faturando.id] })
      setFaturando(null)
      setGuia((prev) => prev ? { ...prev, billingBatchId: lote.id } : prev)
      setSuccess(`Guia adicionada ao lote ${lote.batchNumber}.`)
    } catch (err) {
      setFaturarError(mensagemErroApi(err, 'Não foi possível adicionar a guia ao lote.'))
    } finally {
      setSavingFaturar(false)
    }
  }

  const reservasPorGuia = useMemo(() => {
    if (!guia) return new Map<number, number>()
    const ids = agendamentos.filter(agendamentoReservaSaldoGuia).map((item) => item.id)
    return reservasPorGuiaAPartirDeIds({ [guia.id]: ids })
  }, [agendamentos, guia])

  const podeAgendar = guia != null && guiaTemSaldoLivreParaAgendamento(guia, reservasPorGuia)
  const saldo = guia != null ? saldoDisponivelGuia(guia) : 0

  const dataInvalida = !/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate)
  const horaInvalida = !/^\d{2}:\d{2}$/.test(scheduledTime)
  const duracaoNumero = Number(durationMinutes)
  const duracaoInvalida = !Number.isInteger(duracaoNumero) || duracaoNumero < 1
  const formInvalido = dataInvalida || horaInvalida || duracaoInvalida

  const editDataInvalida = !/^\d{4}-\d{2}-\d{2}$/.test(editDate)
  const editHoraInvalida = !/^\d{2}:\d{2}$/.test(editTime)
  const editDuracaoNumero = Number(editDuration)
  const editDuracaoInvalida = !Number.isInteger(editDuracaoNumero) || editDuracaoNumero < 1
  const editFormInvalido = editDataInvalida || editHoraInvalida || editDuracaoInvalida
  const mensagemFinished = editando ? motivoBloqueioFinalizado(editando) : null
  const finishedDesabilitado = Boolean(mensagemFinished)

  async function recarregarGuiaEAgendamentos(guiaId: number) {
    const [guiaAtualizada, agendamentosAtualizados] = await Promise.all([
      buscarGuia(guiaId),
      listarAgendamentosClinicos({ insuranceGuideId: guiaId }),
    ])
    setGuia(guiaAtualizada)
    setAgendamentos(agendamentosAtualizados)
  }

  function abrirEdicao(item: ClinicalAppointment) {
    setEditando(item)
    setEditDate(isoParaYmdSaoPaulo(item.scheduledAt))
    setEditTime(isoParaHmSaoPaulo(item.scheduledAt))
    setEditDuration(String(duracaoMinutosEntre(item.scheduledAt, item.endsAt)))
    setEditStatus(item.status)
    setEditNotes(item.notes ?? '')
    setEditError(null)
  }

  function fecharEdicao() {
    if (savingEdit) return
    setEditando(null)
    setEditError(null)
  }

  const agendamentosOrdenados = useMemo(
    () =>
      [...agendamentos].sort(
        (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
      ),
    [agendamentos],
  )

  async function agendar() {
    if (!guia || formInvalido || !podeAgendar) return
    const scheduledAt = dataHoraSaoPauloParaIso(scheduledDate, scheduledTime)
    if (!scheduledAt) {
      setError('Informe data e horário válidos.')
      return
    }
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      await criarAgendamentoClinico({
        patientId: guia.patientId,
        healthProfessionalId: guia.healthProfessionalId,
        scheduledAt,
        endsAt: adicionarMinutosIso(scheduledAt, duracaoNumero),
        type: 'health_plan',
        insuranceGuideIds: [guia.id],
      })
      await recarregarGuiaEAgendamentos(guia.id)
      setSuccess('Agendamento criado com sucesso.')
      setScheduledTime('')
      setDurationMinutes('30')
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível criar o agendamento.'))
    } finally {
      setSaving(false)
    }
  }

  async function salvarEdicao() {
    if (!editando || !guia || editFormInvalido) return
    if (editStatus === 'finished' && finishedDesabilitado) return
    const scheduledAt = dataHoraSaoPauloParaIso(editDate, editTime)
    if (!scheduledAt) {
      setEditError('Informe data e horário válidos.')
      return
    }
    setSavingEdit(true)
    setEditError(null)
    setError(null)
    setSuccess(null)
    try {
      const notes = editNotes.trim()
      await atualizarAgendamentoClinico(editando.id, {
        scheduledAt,
        endsAt: adicionarMinutosIso(scheduledAt, editDuracaoNumero),
        status: editStatus,
        notes: notes ? notes : null,
      })
      await recarregarGuiaEAgendamentos(guia.id)
      setEditando(null)
      setSuccess('Agendamento atualizado com sucesso.')
    } catch (err) {
      setEditError(mensagemErroApi(err, 'Não foi possível atualizar o agendamento.'))
    } finally {
      setSavingEdit(false)
    }
  }

  async function excluirEdicao() {
    if (!editando || !guia) return
    const confirmou = window.confirm('Confirma excluir este agendamento?')
    if (!confirmou) return
    setSavingEdit(true)
    setEditError(null)
    setError(null)
    setSuccess(null)
    try {
      await excluirAgendamentoClinico(editando.id)
      await recarregarGuiaEAgendamentos(guia.id)
      setEditando(null)
      setSuccess('Agendamento excluído com sucesso.')
    } catch (err) {
      setEditError(mensagemErroApi(err, 'Não foi possível excluir o agendamento.'))
    } finally {
      setSavingEdit(false)
    }
  }

  const identificador = guia?.guideNumber?.trim() || (guia ? `#${guia.id}` : '')

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Guia {identificador}
        </Typography>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/guias')}>
          Voltar para listagem
        </Button>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {success ? <Alert severity="success">{success}</Alert> : null}

      {loading ? (
        <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress size={20} />
          <Typography>Carregando guia...</Typography>
        </Paper>
      ) : null}

      {!loading && guia ? (
        <>
          <Paper sx={{ p: 3 }}>
            <Stack spacing={1.5}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap">
                <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                  <Typography variant="h6">{guia.patient?.name ?? 'Paciente'}</Typography>
                  <Chip
                    size="small"
                    label={INSURANCE_GUIDE_STATUS_LABELS[guia.status] ?? guia.status}
                    sx={corChipStatusGuia(guia.status)}
                  />
                </Stack>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {guiaElegivelParaFaturar(guia) ? (
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      startIcon={<ReceiptLongIcon />}
                      onClick={() => setFaturando(guia)}
                    >
                      Faturar
                    </Button>
                  ) : null}
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => abrirEditarGuia(guia)}
                  >
                    Editar
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteOutlineIcon />}
                    onClick={() => void excluirGuiaDetalhe()}
                  >
                    Excluir
                  </Button>
                </Stack>
              </Stack>
              <Typography>
                <strong>Guia:</strong> {guia.guideNumber?.trim() || `#${guia.id}`}
              </Typography>
              <Typography>
                <strong>Paciente:</strong> {guia.patient?.name ?? '—'}
              </Typography>
              <Typography>
                <strong>Plano:</strong> {guia.healthPlan?.name ?? '—'}
              </Typography>
              <Typography>
                <strong>Profissional:</strong> {guia.healthProfessional?.name ?? '—'}
              </Typography>
              <Typography>
                <strong>Tipo TISS:</strong>{' '}
                {guia.tissGuideType ? TISS_GUIDE_TYPE_LABELS[guia.tissGuideType] : '—'}
              </Typography>
              <Typography>
                <strong>Autorização:</strong> {formatarDataISO(guia.authorizationDate)}
              </Typography>
              <Typography>
                <strong>Validade:</strong> {formatarDataISO(guia.expirationDate)}
              </Typography>
              <Typography>
                <strong>Faturada:</strong> {guia.isBilled ? 'Sim' : 'Não'}
              </Typography>
              <Typography>
                <strong>Lote:</strong> {guia.billingBatchId != null ? `#${guia.billingBatchId}` : '—'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography component="span">
                  <strong>Saldo:</strong>
                </Typography>
                <ChipSaldoGuia saldo={saldo} />
              </Box>

              <Typography variant="subtitle1" fontWeight={700} sx={{ pt: 1 }}>
                Procedimentos
              </Typography>
              <GuiaProcedimentosTabela
                procedimentos={guia.procedures}
                healthPlanId={guia.healthPlanId}
              />
            </Stack>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Stack spacing={1.5}>
              <Typography variant="subtitle1" fontWeight={700}>
                Agendamentos
              </Typography>
              {agendamentosOrdenados.length === 0 ? (
                <Typography color="text.secondary">Nenhum agendamento associado a esta guia.</Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Data/hora</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Observações</TableCell>
                        <TableCell align="right">Ações</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {agendamentosOrdenados.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            {formatarDataHoraSaoPaulo(item.scheduledAt)} – {formatarHoraSaoPaulo(item.endsAt)}
                          </TableCell>
                          <TableCell>{CLINICAL_APPOINTMENT_STATUS_LABELS[item.status]}</TableCell>
                          <TableCell>{item.notes ?? '—'}</TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              aria-label="Editar agendamento"
                              onClick={() => abrirEdicao(item)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Stack>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Stack spacing={1.5}>
              <Typography variant="subtitle1" fontWeight={700}>
                Novo agendamento
              </Typography>
              {!podeAgendar ? (
                <Alert severity="warning">
                  Não há saldo disponível nesta guia para um novo agendamento.
                </Alert>
              ) : null}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <CampoData
                  label="Data"
                  value={scheduledDate}
                  onChange={setScheduledDate}
                  error={dataInvalida}
                  helperText={dataInvalida ? 'Informe a data' : ' '}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Horário"
                  type="time"
                  inputProps={{ step: 1800 }}
                  InputLabelProps={{ shrink: true }}
                  value={scheduledTime}
                  onChange={(event) => setScheduledTime(event.target.value)}
                  error={scheduledTime !== '' && horaInvalida}
                  helperText={scheduledTime !== '' && horaInvalida ? 'Informe o horário' : ' '}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Duração (min)"
                  type="number"
                  inputProps={{ min: 1, step: 1 }}
                  InputLabelProps={{ shrink: true }}
                  value={durationMinutes}
                  onChange={(event) => setDurationMinutes(event.target.value)}
                  error={duracaoInvalida}
                  helperText={duracaoInvalida ? 'Informe um inteiro ≥ 1' : ' '}
                  sx={{ width: { xs: '100%', sm: 160 } }}
                />
              </Stack>
              <Button
                variant="contained"
                onClick={() => void agendar()}
                disabled={saving || formInvalido || !podeAgendar}
                sx={{ alignSelf: 'flex-start' }}
              >
                {saving ? 'Agendando...' : 'Agendar'}
              </Button>
            </Stack>
          </Paper>
        </>
      ) : null}

      <Dialog open={Boolean(editando)} onClose={fecharEdicao} fullWidth maxWidth="sm">
        <DialogTitle>Editar agendamento</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 0.5 }}>
            {editError ? <Alert severity="error">{editError}</Alert> : null}
            {mensagemFinished && editStatus === 'finished' ? (
              <Alert severity="warning">{mensagemFinished}</Alert>
            ) : null}
            <TextField
              select
              label="Status"
              value={editStatus}
              onChange={(event) => setEditStatus(event.target.value as ClinicalAppointmentStatus)}
            >
              {CLINICAL_APPOINTMENT_STATUSES.map((status) => (
                <MenuItem
                  key={status}
                  value={status}
                  disabled={status === 'finished' && finishedDesabilitado}
                >
                  {CLINICAL_APPOINTMENT_STATUS_LABELS[status]}
                </MenuItem>
              ))}
            </TextField>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <CampoData
                label="Data"
                value={editDate}
                onChange={setEditDate}
                error={editDataInvalida}
                helperText={editDataInvalida ? 'Informe a data' : ' '}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Horário"
                type="time"
                inputProps={{ step: 1800 }}
                InputLabelProps={{ shrink: true }}
                value={editTime}
                onChange={(event) => setEditTime(event.target.value)}
                error={editHoraInvalida}
                helperText={editHoraInvalida ? 'Informe o horário' : ' '}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Duração (min)"
                type="number"
                inputProps={{ min: 1, step: 1 }}
                InputLabelProps={{ shrink: true }}
                value={editDuration}
                onChange={(event) => setEditDuration(event.target.value)}
                error={editDuracaoInvalida}
                helperText={editDuracaoInvalida ? 'Informe um inteiro ≥ 1' : ' '}
                sx={{ width: { xs: '100%', sm: 160 } }}
              />
            </Stack>
            <TextField
              label="Observações"
              multiline
              minRows={2}
              value={editNotes}
              onChange={(event) => setEditNotes(event.target.value)}
            />
            <Button
              color="error"
              onClick={() => void excluirEdicao()}
              disabled={savingEdit}
              sx={{ alignSelf: 'flex-start' }}
            >
              Excluir
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={fecharEdicao} disabled={savingEdit}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={() => void salvarEdicao()}
            disabled={
              savingEdit ||
              editFormInvalido ||
              (editStatus === 'finished' && finishedDesabilitado)
            }
          >
            {savingEdit ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog editar guia ─────────────────────────────────────── */}
      <Dialog open={Boolean(editandoGuia)} onClose={fecharEditarGuia} fullWidth maxWidth="md">
        <DialogTitle>Editar guia</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 0.5 }}>
            {editGuiaError ? <Alert severity="error">{editGuiaError}</Alert> : null}
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
              value={statusEdicaoGuia}
              onChange={(event) => setStatusEdicaoGuia(event.target.value as InsuranceGuideStatus)}
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
              onChange={(event) => {
                setGuideNumberEdicao(event.target.value)
                setGuideNumberEdicaoError(null)
              }}
              error={Boolean(guideNumberEdicaoError)}
              helperText={guideNumberEdicaoError ?? 'Obrigatório no XML TISS'}
            />
            <CampoData
              label="Data de autorização"
              value={authorizationDateEdicao}
              onChange={(next) => {
                setAuthorizationDateEdicao(next)
                recalcularValidade(next, prazoPlanoEdicao)
              }}
              error={authorizationDateInvalida}
              helperText={authorizationDateInvalida ? 'Informe a data de autorização' : ' '}
            />
            <CampoData
              label="Data de validade"
              value={expirationDateEdicao}
              onChange={setExpirationDateEdicao}
              error={expirationInvalida}
              helperText={
                expirationInvalida
                  ? 'Informe a data de validade'
                  : prazoPlanoEdicao != null
                    ? `Sugestão: data de autorização + prazo do plano (${prazoPlanoEdicao} dias). Pode ser alterada.`
                    : ' '
              }
            />
            <Typography variant="subtitle2" fontWeight={700}>
              Procedimentos
            </Typography>
            {procedimentosEdicao.map((item, index) => {
              const selecionados = procedimentosEdicao
                .map((row, rowIndex) => (rowIndex === index ? undefined : row.procedureId))
                .filter((pid): pid is number => typeof pid === 'number')
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
                      const proc = opcoes.find((p) => p.id === value)
                      const preco =
                        healthPlanIdEdicao === '' ? undefined : valorDoPlano(proc, healthPlanIdEdicao)
                      setProcedimentosEdicao((prev) =>
                        prev.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, procedureId: value, value: preco } : row,
                        ),
                      )
                    }}
                    error={item.procedureId === ''}
                    helperText={item.procedureId === '' ? 'Selecione o procedimento' : ' '}
                    sx={{ flex: 1, minWidth: 220 }}
                    disabled={item.usedQuantity > 0}
                  >
                    <MenuItem value="" disabled>Selecione</MenuItem>
                    {opcoes.map((proc) => {
                      const tiss = healthPlanIdEdicao === '' ? undefined : tissCodeDoPlano(proc, healthPlanIdEdicao)
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
              startIcon={<EditIcon />}
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
          <Button onClick={fecharEditarGuia} disabled={savingEditGuia}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={() => void salvarEdicaoGuia()}
            disabled={savingEditGuia || guiaFormInvalido}
          >
            {savingEditGuia ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog faturar guia ─────────────────────────────────────── */}
      <Dialog
        open={Boolean(faturando)}
        onClose={() => { if (!savingFaturar) { setFaturando(null); setFaturarError(null) } }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Faturar guia</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 0.5 }}>
            {faturarError ? <Alert severity="error">{faturarError}</Alert> : null}
            <Alert severity="info">
              A guia
              {faturando ? ` de ${faturando.patient?.name ?? 'paciente'}` : ''}
              {faturando
                ? ` no valor de ${formatarMoedaBRL(valorFaturavelGuia(faturando.procedures))}`
                : ''}{' '}
              será incluída em um lote aberto. O faturamento financeiro é feito depois, na tela do lote.
            </Alert>
            <FormControl>
              <RadioGroup
                value={faturarModo}
                onChange={(event) => {
                  const modo = event.target.value as 'novo' | 'existente'
                  setFaturarModo(modo)
                  if (modo === 'novo') setLoteSelecionadoId(null)
                }}
              >
                <FormControlLabel value="novo" control={<Radio />} label="Criar um novo lote" />
                <FormControlLabel
                  value="existente"
                  control={<Radio />}
                  label="Adicionar a um lote existente"
                  disabled={loadingLotes || lotesAbertos.length === 0}
                />
              </RadioGroup>
            </FormControl>
            {loadingLotes ? (
              <Stack direction="row" alignItems="center" gap={1.5}>
                <CircularProgress size={20} />
                <Typography>Carregando lotes abertos...</Typography>
              </Stack>
            ) : null}
            {!loadingLotes && lotesAbertos.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Não há lotes abertos deste plano. Um novo lote será criado.
              </Typography>
            ) : null}
            {faturarModo === 'existente' && lotesAbertos.length > 0 ? (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" />
                    <TableCell>Lote</TableCell>
                    <TableCell>Guias</TableCell>
                    <TableCell align="right">Valor</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lotesAbertos.map((lote) => (
                    <TableRow
                      key={lote.id}
                      hover
                      selected={loteSelecionadoId === lote.id}
                      onClick={() => setLoteSelecionadoId(lote.id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell padding="checkbox">
                        <Radio
                          checked={loteSelecionadoId === lote.id}
                          onChange={() => setLoteSelecionadoId(lote.id)}
                          value={lote.id}
                          inputProps={{ 'aria-label': `Selecionar lote ${lote.batchNumber}` }}
                        />
                      </TableCell>
                      <TableCell>{lote.batchNumber}</TableCell>
                      <TableCell>{lote.guides.length}</TableCell>
                      <TableCell align="right">{formatarMoedaBRL(lote.billedAmount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => { setFaturando(null); setFaturarError(null) }}
            disabled={savingFaturar}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={() => void confirmarFaturar()}
            disabled={
              savingFaturar ||
              loadingLotes ||
              (faturarModo === 'existente' && loteSelecionadoId == null)
            }
          >
            {savingFaturar ? 'Adicionando...' : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
