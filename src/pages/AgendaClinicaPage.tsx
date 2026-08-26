import AddIcon from '@mui/icons-material/Add'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import {
  Alert,
  Box,
  Button,
  Chip,
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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AgendaClinicaCabecalho,
  AgendaClinicaCalendario,
  type VisaoAgenda,
} from '../components/AgendaClinicaCalendario'
import { AgendamentoClinicoForm } from '../components/AgendamentoClinicoForm'
import { AgendamentosClinicosTable } from '../components/AgendamentosClinicosTable'
import { PacienteBuscaAutocomplete } from '../components/PacienteBuscaAutocomplete'
import { ProfissionalBuscaAutocomplete } from '../components/ProfissionalBuscaAutocomplete'
import type { AgendamentoClinicoFormValues } from '../schemas/agendamentoClinico.schema'
import {
  atualizarAgendamentoClinico,
  buscarAgendamentoClinico,
  criarAgendamentoClinico,
  excluirAgendamentoClinico,
  listarAgendamentosClinicos,
} from '../services/clinical-appointments.service'
import {
  CLINICAL_APPOINTMENT_STATUSES,
  CLINICAL_APPOINTMENT_STATUS_CORES,
  CLINICAL_APPOINTMENT_STATUS_LABELS,
  CLINICAL_APPOINTMENT_TYPES,
  CLINICAL_APPOINTMENT_TYPE_CORES,
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
  adicionarMinutosIso,
  dataHoraSaoPauloParaIso,
  domingoDaSemana,
  duracaoMinutosEntre,
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

function montarIntervalo(values: AgendamentoClinicoFormValues): { scheduledAt: string; endsAt: string } {
  const scheduledAt = dataHoraSaoPauloParaIso(values.scheduledDate, values.scheduledTime)
  return {
    scheduledAt,
    endsAt: adicionarMinutosIso(scheduledAt, values.durationMinutes),
  }
}

function notesDoFormulario(values: AgendamentoClinicoFormValues): string | null {
  const notes = values.notes?.trim()
  return notes ? notes : null
}

function montarPayloadCriacao(values: AgendamentoClinicoFormValues): CreateClinicalAppointmentRequest {
  const { scheduledAt, endsAt } = montarIntervalo(values)
  const notes = notesDoFormulario(values)
  if (values.type === 'private') {
    return {
      patientId: values.patientId,
      healthProfessionalId: values.healthProfessionalId,
      scheduledAt,
      endsAt,
      type: 'private',
      status: values.status,
      procedureIds: values.procedureIds,
      ...(notes ? { notes } : {}),
    }
  }
  return {
    patientId: values.patientId,
    healthProfessionalId: values.healthProfessionalId,
    scheduledAt,
    endsAt,
    type: 'health_plan',
    status: values.status,
    insuranceGuideIds: values.insuranceGuideIds,
    ...(notes ? { notes } : {}),
  }
}

function idsIguais(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false
  const ordenadosA = [...a].sort((x, y) => x - y)
  const ordenadosB = [...b].sort((x, y) => x - y)
  return ordenadosA.every((id, index) => id === ordenadosB[index])
}

function montarPayloadAtualizacao(
  values: AgendamentoClinicoFormValues,
  atual: ClinicalAppointment,
): UpdateClinicalAppointmentRequest {
  const { scheduledAt, endsAt } = montarIntervalo(values)
  const tipoMudou = values.type !== atual.type
  const payload: UpdateClinicalAppointmentRequest = {
    patientId: values.patientId,
    healthProfessionalId: values.healthProfessionalId,
    scheduledAt,
    endsAt,
    status: values.status,
    notes: notesDoFormulario(values),
  }

  if (tipoMudou) {
    payload.type = values.type
  }

  if (values.type === 'private') {
    const atuais = atual.procedures.map((item) => item.procedureId)
    if (tipoMudou || !idsIguais(values.procedureIds, atuais)) {
      payload.procedureIds = values.procedureIds
    }
  } else {
    const atuais = idsGuiasDoAgendamento(atual)
    if (tipoMudou || !idsIguais(values.insuranceGuideIds, atuais)) {
      payload.insuranceGuideIds = values.insuranceGuideIds
    }
  }

  return payload
}

export function AgendaClinicaPage() {
  const [visao, setVisao] = useState<VisaoTela>('semana')
  const [dataRef, setDataRef] = useState(() => ymdEmSaoPaulo())
  const [agendamentos, setAgendamentos] = useState<ClinicalAppointment[]>([])
  const [filtroPaciente, setFiltroPaciente] = useState<Patient | null>(null)
  const [filtroProfissional, setFiltroProfissional] = useState<HealthProfessional | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [filtroTipo, setFiltroTipo] = useState<ClinicalAppointmentType | ''>('')
  const [filtroStatus, setFiltroStatus] = useState<ClinicalAppointmentStatus | ''>('')

  const [dialogAberto, setDialogAberto] = useState(false)
  const [editando, setEditando] = useState<ClinicalAppointment | null>(null)
  const [dataPreenchida, setDataPreenchida] = useState(ymdEmSaoPaulo())
  const [horaPreenchida, setHoraPreenchida] = useState('08:00')
  const [cabecalhoCompacto, setCabecalhoCompacto] = useState(false)
  const sentinelCabecalhoRef = useRef<HTMLDivElement>(null)

  const { from, to } = useMemo(() => intervaloVisivel(visao, dataRef), [visao, dataRef])
  const filtroPacienteId = filtroPaciente?.id ?? ''
  const filtroProfissionalId = filtroProfissional?.id ?? ''
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
        await atualizarAgendamentoClinico(editando.id, montarPayloadAtualizacao(values, editando))
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
  const calendarioVisivel = filtroAgendaAtivo && !loading && visao !== 'lista'

  const chipsFiltrosSelecionados = useMemo(() => {
    const chips: { key: string; label: string }[] = []
    if (filtroPaciente) {
      chips.push({ key: 'paciente', label: `Paciente: ${filtroPaciente.name}` })
    }
    if (filtroProfissional) {
      chips.push({ key: 'profissional', label: `Profissional: ${filtroProfissional.name}` })
    }
    if (filtroTipo !== '') {
      chips.push({ key: 'tipo', label: CLINICAL_APPOINTMENT_TYPE_LABELS[filtroTipo] })
    }
    if (filtroStatus !== '') {
      chips.push({ key: 'status', label: CLINICAL_APPOINTMENT_STATUS_LABELS[filtroStatus] })
    }
    return chips
  }, [filtroPaciente, filtroProfissional, filtroTipo, filtroStatus])

  useEffect(() => {
    const el = sentinelCabecalhoRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        setCabecalhoCompacto(!entry.isIntersecting)
      },
      { threshold: 0 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

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

      <Box>
        <Box ref={sentinelCabecalhoRef} aria-hidden sx={{ height: 1, mt: '-1px' }} />
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 12,
            bgcolor: 'grey.100',
          }}
        >
          <Paper sx={{ p: cabecalhoCompacto ? 1 : 1.5 }}>
            <Box sx={{ display: cabecalhoCompacto ? 'none' : 'block' }} aria-hidden={cabecalhoCompacto}>
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
                  <Box sx={{ minWidth: 220, flex: 1 }}>
                    <PacienteBuscaAutocomplete
                      value={filtroPaciente}
                      onChange={setFiltroPaciente}
                      size="small"
                    />
                  </Box>
                  <Box sx={{ minWidth: 220, flex: 1 }}>
                    <ProfissionalBuscaAutocomplete
                      value={filtroProfissional}
                      onChange={setFiltroProfissional}
                      size="small"
                    />
                  </Box>
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
            </Box>

            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
              useFlexGap
              aria-hidden={!cabecalhoCompacto}
              aria-label="Filtros da agenda. Clique para voltar ao topo e editar."
              role={cabecalhoCompacto ? 'button' : undefined}
              tabIndex={cabecalhoCompacto ? 0 : -1}
              sx={{
                display: cabecalhoCompacto ? 'flex' : 'none',
                cursor: 'pointer',
              }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }
              }}
              title="Role para o topo para editar os filtros"
            >
              <Typography
                variant="subtitle1"
                fontWeight={700}
                sx={{ textTransform: 'capitalize', lineHeight: 1.3 }}
              >
                {tituloPeriodo(visao, dataRef)}
              </Typography>
              {chipsFiltrosSelecionados.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Nenhum filtro selecionado
                </Typography>
              ) : (
                chipsFiltrosSelecionados.map((chip) => (
                  <Chip
                    key={chip.key}
                    label={chip.label}
                    size="small"
                    variant="outlined"
                    sx={{ cursor: 'inherit', pointerEvents: 'none' }}
                  />
                ))
              )}
            </Stack>
          </Paper>

          {error ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          ) : null}
          {success ? (
            <Alert severity="success" sx={{ mt: 2 }}>
              {success}
            </Alert>
          ) : null}

          {calendarioVisivel ? (
            <Paper
              sx={{
                mt: cabecalhoCompacto ? 1 : 2,
                p: 1,
                pb: 0,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
              }}
            >
              {cabecalhoCompacto ? null : (
                <Stack direction="row" spacing={2} sx={{ px: 1, py: 0.5 }} flexWrap="wrap" useFlexGap>
                  {CLINICAL_APPOINTMENT_STATUSES.map((status) => (
                    <Typography
                      key={status}
                      variant="caption"
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}
                    >
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          bgcolor: CLINICAL_APPOINTMENT_STATUS_CORES[status],
                          borderRadius: 0.5,
                        }}
                      />
                      {CLINICAL_APPOINTMENT_STATUS_LABELS[status]}
                    </Typography>
                  ))}
                  {CLINICAL_APPOINTMENT_TYPES.map((tipo) => (
                    <Typography
                      key={tipo}
                      variant="caption"
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}
                    >
                      <Box
                        sx={{
                          width: 4,
                          height: 12,
                          bgcolor: CLINICAL_APPOINTMENT_TYPE_CORES[tipo],
                          borderRadius: 0.25,
                        }}
                      />
                      {CLINICAL_APPOINTMENT_TYPE_LABELS[tipo]}
                    </Typography>
                  ))}
                </Stack>
              )}
              <AgendaClinicaCabecalho visao={visaoCalendario} dataRef={dataRef} />
            </Paper>
          ) : null}
        </Box>

        {!filtroAgendaAtivo ? (
          <Paper sx={{ p: 3, mt: 2 }}>
            <Typography color="text.secondary">
              Selecione um paciente ou um profissional para visualizar a agenda.
            </Typography>
          </Paper>
        ) : loading ? (
          <Paper sx={{ p: 3, mt: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <CircularProgress size={20} />
            <Typography>Carregando agenda clínica...</Typography>
          </Paper>
        ) : visao === 'lista' ? (
          <Box sx={{ mt: 2 }}>
            <AgendamentosClinicosTable agendamentos={agendamentos} onAbrir={abrirEvento} />
          </Box>
        ) : (
          <Paper
            sx={{
              p: 1,
              pt: 0.5,
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
            }}
          >
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
      </Box>

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
                        durationMinutes: duracaoMinutosEntre(editando.scheduledAt, editando.endsAt),
                        status: editando.status,
                        type: editando.type,
                        procedureIds: editando.procedures.map((item) => item.procedureId),
                        insuranceGuideIds: idsGuiasDoAgendamento(editando),
                        notes: editando.notes ?? '',
                      }
                    : {
                        patientId: undefined,
                        healthProfessionalId: undefined,
                        scheduledDate: dataPreenchida,
                        scheduledTime: horaPreenchida,
                        durationMinutes: 30,
                        status: 'marked',
                        type: 'private',
                        procedureIds: [],
                        insuranceGuideIds: [],
                        notes: '',
                      }
                }
                pacientes={filtroPaciente ? [filtroPaciente] : []}
                profissionais={filtroProfissional ? [filtroProfissional] : []}
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
