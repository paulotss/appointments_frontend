import AddIcon from '@mui/icons-material/Add'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AgendaClinicaCalendario, type VisaoAgenda } from '../components/AgendaClinicaCalendario'
import { AgendamentoClinicoForm } from '../components/AgendamentoClinicoForm'
import { AgendamentosClinicosTable } from '../components/AgendamentosClinicosTable'
import type { AgendamentoClinicoFormValues } from '../schemas/agendamentoClinico.schema'
import {
  atualizarAgendamentoClinico,
  buscarAgendamentoClinico,
  criarAgendamentoClinico,
  excluirAgendamentoClinico,
  listarAgendamentosClinicos,
} from '../services/clinical-appointments.service'
import { listarProfissionais } from '../services/health-professionals.service'
import { listarPacientes } from '../services/patients.service'
import {
  CLINICAL_APPOINTMENT_STATUSES,
  CLINICAL_APPOINTMENT_STATUS_LABELS,
  CLINICAL_APPOINTMENT_TYPES,
  CLINICAL_APPOINTMENT_TYPE_LABELS,
  idsGuiasDoAgendamento,
  type ClinicalAppointment,
  type ClinicalAppointmentStatus,
  type ClinicalAppointmentType,
  type CreateClinicalAppointmentRequest,
  type UpdateClinicalAppointmentRequest,
} from '../types/agendamentoClinico'
import type { Patient } from '../types/paciente'
import type { HealthProfessional } from '../types/profissional'
import { mensagemErroApi } from '../utils/apiError'
import {
  adicionarDiasYmd,
  dataHoraSaoPauloParaIso,
  domingoDaSemana,
  gradeDoMes,
  isoParaHmSaoPaulo,
  isoParaYmdSaoPaulo,
  primeiroDiaDoMes,
  segundaDaSemana,
  tituloDiaPt,
  tituloMesPt,
  tituloSemanaPt,
  ultimoDiaDoMes,
  ymdEmSaoPaulo,
} from '../utils/dataHoraSaoPaulo'

type VisaoTela = VisaoAgenda | 'lista'

function intervaloVisivel(visao: VisaoTela, dataRef: string): { from: string; to: string } {
  if (visao === 'dia') return { from: dataRef, to: dataRef }
  if (visao === 'semana') return { from: segundaDaSemana(dataRef), to: domingoDaSemana(dataRef) }
  const grade = gradeDoMes(dataRef)
  if (visao === 'mes') return { from: grade[0], to: grade[grade.length - 1] }
  return { from: primeiroDiaDoMes(dataRef), to: ultimoDiaDoMes(dataRef) }
}

function tituloPeriodo(visao: VisaoTela, dataRef: string): string {
  if (visao === 'dia') return tituloDiaPt(dataRef)
  if (visao === 'semana') {
    return tituloSemanaPt(segundaDaSemana(dataRef), domingoDaSemana(dataRef))
  }
  return tituloMesPt(dataRef)
}

function montarPayloadCriacao(values: AgendamentoClinicoFormValues): CreateClinicalAppointmentRequest {
  const scheduledAt = dataHoraSaoPauloParaIso(values.scheduledDate, values.scheduledTime)
  if (values.type === 'private') {
    return {
      patientId: values.patientId,
      healthProfessionalId: values.healthProfessionalId,
      scheduledAt,
      type: 'private',
      status: values.status,
      procedureIds: values.procedureIds,
    }
  }
  return {
    patientId: values.patientId,
    healthProfessionalId: values.healthProfessionalId,
    scheduledAt,
    type: 'health_plan',
    status: values.status,
    insuranceGuideIds: values.insuranceGuideIds,
  }
}

function montarPayloadAtualizacao(values: AgendamentoClinicoFormValues): UpdateClinicalAppointmentRequest {
  const scheduledAt = dataHoraSaoPauloParaIso(values.scheduledDate, values.scheduledTime)
  if (values.type === 'private') {
    return {
      patientId: values.patientId,
      healthProfessionalId: values.healthProfessionalId,
      scheduledAt,
      type: 'private',
      status: values.status,
      procedureIds: values.procedureIds,
    }
  }
  return {
    patientId: values.patientId,
    healthProfessionalId: values.healthProfessionalId,
    scheduledAt,
    type: 'health_plan',
    status: values.status,
    insuranceGuideIds: values.insuranceGuideIds,
  }
}

export function AgendaClinicaPage() {
  const [visao, setVisao] = useState<VisaoTela>('semana')
  const [dataRef, setDataRef] = useState(() => ymdEmSaoPaulo())
  const [agendamentos, setAgendamentos] = useState<ClinicalAppointment[]>([])
  const [pacientes, setPacientes] = useState<Patient[]>([])
  const [profissionais, setProfissionais] = useState<HealthProfessional[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [filtroPacienteId, setFiltroPacienteId] = useState<number | ''>('')
  const [filtroProfissionalId, setFiltroProfissionalId] = useState<number | ''>('')
  const [filtroTipo, setFiltroTipo] = useState<ClinicalAppointmentType | ''>('')
  const [filtroStatus, setFiltroStatus] = useState<ClinicalAppointmentStatus | ''>('')

  const [dialogAberto, setDialogAberto] = useState(false)
  const [editando, setEditando] = useState<ClinicalAppointment | null>(null)
  const [dataPreenchida, setDataPreenchida] = useState(ymdEmSaoPaulo())
  const [horaPreenchida, setHoraPreenchida] = useState('08:00')

  const { from, to } = useMemo(() => intervaloVisivel(visao, dataRef), [visao, dataRef])
  const filtroAgendaAtivo = filtroPacienteId !== '' || filtroProfissionalId !== ''

  const carregarAgendamentos = useCallback(async () => {
    if (!filtroAgendaAtivo) {
      setAgendamentos([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await listarAgendamentosClinicos({
        from,
        to,
        ...(filtroPacienteId === '' ? {} : { patientId: filtroPacienteId }),
        ...(filtroProfissionalId === '' ? {} : { healthProfessionalId: filtroProfissionalId }),
        ...(filtroTipo === '' ? {} : { type: filtroTipo }),
        ...(filtroStatus === '' ? {} : { status: filtroStatus }),
      })
      setAgendamentos(data)
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível carregar a agenda clínica.'))
    } finally {
      setLoading(false)
    }
  }, [from, to, filtroAgendaAtivo, filtroPacienteId, filtroProfissionalId, filtroTipo, filtroStatus])

  useEffect(() => {
    void carregarAgendamentos()
  }, [carregarAgendamentos])

  useEffect(() => {
    async function carregarCadastros() {
      try {
        const [pacientesData, profissionaisData] = await Promise.all([
          listarPacientes(),
          listarProfissionais(),
        ])
        setPacientes(pacientesData)
        setProfissionais(profissionaisData)
      } catch (err) {
        setError(mensagemErroApi(err, 'Não foi possível carregar pacientes e profissionais.'))
      }
    }
    void carregarCadastros()
  }, [])

  function irHoje() {
    setDataRef(ymdEmSaoPaulo())
  }

  function irAnterior() {
    if (visao === 'dia') setDataRef((prev) => adicionarDiasYmd(prev, -1))
    else if (visao === 'semana') setDataRef((prev) => adicionarDiasYmd(prev, -7))
    else setDataRef((prev) => adicionarDiasYmd(primeiroDiaDoMes(prev), -1))
  }

  function irProximo() {
    if (visao === 'dia') setDataRef((prev) => adicionarDiasYmd(prev, 1))
    else if (visao === 'semana') setDataRef((prev) => adicionarDiasYmd(prev, 7))
    else setDataRef((prev) => adicionarDiasYmd(ultimoDiaDoMes(prev), 1))
  }

  function abrirNovo(ymd?: string, hm?: string) {
    setEditando(null)
    setDataPreenchida(ymd ?? dataRef)
    setHoraPreenchida(hm ?? '08:00')
    setDialogAberto(true)
    setError(null)
  }

  function abrirEvento(item: ClinicalAppointment) {
    setEditando(item)
    setDataPreenchida(isoParaYmdSaoPaulo(item.scheduledAt))
    setHoraPreenchida(isoParaHmSaoPaulo(item.scheduledAt))
    setDialogAberto(true)
    setError(null)
    void buscarAgendamentoClinico(item.id)
      .then((completo) => {
        setEditando(completo)
        setDataPreenchida(isoParaYmdSaoPaulo(completo.scheduledAt))
        setHoraPreenchida(isoParaHmSaoPaulo(completo.scheduledAt))
      })
      .catch(() => {
        /* mantém o item da listagem */
      })
  }

  function fecharDialog() {
    if (saving) return
    setDialogAberto(false)
    setEditando(null)
  }

  async function salvar(values: AgendamentoClinicoFormValues) {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      if (editando) {
        await atualizarAgendamentoClinico(editando.id, montarPayloadAtualizacao(values))
        setSuccess('Agendamento atualizado com sucesso.')
      } else {
        await criarAgendamentoClinico(montarPayloadCriacao(values))
        setSuccess('Agendamento criado com sucesso.')
      }
      setDialogAberto(false)
      setEditando(null)
      await carregarAgendamentos()
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível salvar o agendamento.'))
    } finally {
      setSaving(false)
    }
  }

  async function excluir() {
    if (!editando) return
    const confirmou = window.confirm('Confirma excluir este agendamento clínico?')
    if (!confirmou) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      await excluirAgendamentoClinico(editando.id)
      setSuccess('Agendamento excluído com sucesso.')
      setDialogAberto(false)
      setEditando(null)
      await carregarAgendamentos()
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível excluir o agendamento.'))
    } finally {
      setSaving(false)
    }
  }

  const visaoCalendario: VisaoAgenda = visao === 'lista' ? 'semana' : visao

  return (
    <Stack spacing={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap">
        <Typography variant="h5" fontWeight={700}>
          Agenda clínica
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => abrirNovo()}>
          Novo agendamento
        </Button>
      </Box>

      <Paper sx={{ p: 1.5 }}>
        <Stack spacing={1.5}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Button size="small" variant="outlined" onClick={irHoje}>
                Hoje
              </Button>
              <IconButton aria-label="Anterior" onClick={irAnterior} size="small">
                <ChevronLeftIcon />
              </IconButton>
              <IconButton aria-label="Próximo" onClick={irProximo} size="small">
                <ChevronRightIcon />
              </IconButton>
            </Stack>
            <Typography variant="h6" fontWeight={700} sx={{ flex: 1, textTransform: 'capitalize' }}>
              {tituloPeriodo(visao, dataRef)}
            </Typography>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={visao}
              onChange={(_, value: VisaoTela | null) => {
                if (value) setVisao(value)
              }}
            >
              <ToggleButton value="dia">Dia</ToggleButton>
              <ToggleButton value="semana">Semana</ToggleButton>
              <ToggleButton value="mes">Mês</ToggleButton>
              <ToggleButton value="lista">Lista</ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
            <Autocomplete
              options={pacientes}
              getOptionLabel={(item) => item.name}
              isOptionEqualToValue={(option, selected) => option.id === selected.id}
              value={pacientes.find((item) => item.id === filtroPacienteId) ?? null}
              onChange={(_, item) => setFiltroPacienteId(item?.id ?? '')}
              sx={{ minWidth: 220, flex: 1 }}
              renderInput={(params) => (
                <TextField {...params} label="Paciente" size="small" placeholder="Selecione" />
              )}
            />
            <Autocomplete
              options={profissionais}
              getOptionLabel={(item) => item.name}
              isOptionEqualToValue={(option, selected) => option.id === selected.id}
              value={profissionais.find((item) => item.id === filtroProfissionalId) ?? null}
              onChange={(_, item) => setFiltroProfissionalId(item?.id ?? '')}
              sx={{ minWidth: 220, flex: 1 }}
              renderInput={(params) => (
                <TextField {...params} label="Profissional" size="small" placeholder="Selecione" />
              )}
            />
            <TextField
              select
              size="small"
              label="Tipo"
              value={filtroTipo}
              onChange={(event) => setFiltroTipo(event.target.value as ClinicalAppointmentType | '')}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="">Todos</MenuItem>
              {CLINICAL_APPOINTMENT_TYPES.map((tipo) => (
                <MenuItem key={tipo} value={tipo}>
                  {CLINICAL_APPOINTMENT_TYPE_LABELS[tipo]}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Status"
              value={filtroStatus}
              onChange={(event) => setFiltroStatus(event.target.value as ClinicalAppointmentStatus | '')}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="">Todos</MenuItem>
              {CLINICAL_APPOINTMENT_STATUSES.map((status) => (
                <MenuItem key={status} value={status}>
                  {CLINICAL_APPOINTMENT_STATUS_LABELS[status]}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </Stack>
      </Paper>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {success ? <Alert severity="success">{success}</Alert> : null}

      {!filtroAgendaAtivo ? (
        <Paper sx={{ p: 3 }}>
          <Typography color="text.secondary">
            Selecione um paciente ou um profissional para visualizar a agenda.
          </Typography>
        </Paper>
      ) : loading ? (
        <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress size={20} />
          <Typography>Carregando agenda clínica...</Typography>
        </Paper>
      ) : visao === 'lista' ? (
        <AgendamentosClinicosTable agendamentos={agendamentos} onAbrir={abrirEvento} />
      ) : (
        <Paper sx={{ p: 1, overflow: 'hidden' }}>
          <Stack direction="row" spacing={2} sx={{ px: 1, py: 0.5 }} flexWrap="wrap">
            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 12, height: 12, bgcolor: '#1f8f66', borderRadius: 0.5 }} />
              Particular
            </Typography>
            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 12, height: 12, bgcolor: '#1565c0', borderRadius: 0.5 }} />
              Plano de saúde
            </Typography>
            <Typography variant="caption" color="text.secondary">
              A barra lateral indica o status (marcado, confirmado, em espera, atendido, finalizado).
            </Typography>
          </Stack>
          <AgendaClinicaCalendario
            visao={visaoCalendario}
            dataRef={dataRef}
            agendamentos={agendamentos}
            onSlotClick={(ymd, hm) => abrirNovo(ymd, hm)}
            onEventoClick={abrirEvento}
            onDiaClick={(ymd) => {
              setDataRef(ymd)
              setVisao('dia')
            }}
          />
        </Paper>
      )}

      <Dialog
        open={dialogAberto}
        onClose={fecharDialog}
        fullWidth
        maxWidth="md"
        disableEnforceFocus
      >
        <DialogTitle>{editando ? 'Editar agendamento' : 'Novo agendamento'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            {dialogAberto ? (
              <AgendamentoClinicoForm
                key={editando ? `edit-${editando.id}` : `novo-${dataPreenchida}-${horaPreenchida}`}
                defaultValues={
                  editando
                    ? {
                        patientId: editando.patientId,
                        healthProfessionalId: editando.healthProfessionalId,
                        scheduledDate: isoParaYmdSaoPaulo(editando.scheduledAt),
                        scheduledTime: isoParaHmSaoPaulo(editando.scheduledAt),
                        status: editando.status,
                        type: editando.type,
                        procedureIds: editando.procedures.map((item) => item.procedureId),
                        insuranceGuideIds: idsGuiasDoAgendamento(editando),
                      }
                    : {
                        patientId: undefined,
                        healthProfessionalId: undefined,
                        scheduledDate: dataPreenchida,
                        scheduledTime: horaPreenchida,
                        status: 'marked',
                        type: 'private',
                        procedureIds: [],
                        insuranceGuideIds: [],
                      }
                }
                pacientes={pacientes}
                profissionais={profissionais}
                loading={saving}
                submitLabel={editando ? 'Salvar' : 'Agendar'}
                agendamentoAtual={editando}
                onSubmit={(values) => void salvar(values)}
                onCancel={fecharDialog}
                onExcluir={editando ? () => void excluir() : undefined}
              />
            ) : null}
          </Box>
        </DialogContent>
      </Dialog>
    </Stack>
  )
}
