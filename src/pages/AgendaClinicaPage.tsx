import {
  Alert,
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AgendaClinicaCabecalho,
  AgendaClinicaCalendario,
  type VisaoAgenda,
} from '../components/AgendaClinicaCalendario'
import { AgendaClinicaToolbar, type VisaoTela } from '../components/AgendaClinicaToolbar'
import { AgendamentoClinicoForm } from '../components/AgendamentoClinicoForm'
import { AgendamentosClinicosTable } from '../components/AgendamentosClinicosTable'
import { AjusteBloqueioDiaDialog } from '../components/AjusteBloqueioDiaDialog'
import { TOP_BAR_HEIGHT } from '../layouts/AppLayout'
import type { AgendamentoClinicoFormValues } from '../schemas/agendamentoClinico.schema'
import {
  atualizarAgendamentoClinico,
  buscarAgendamentoClinico,
  criarAgendamentoClinico,
  excluirAgendamentoClinico,
  listarAgendamentosClinicos,
} from '../services/clinical-appointments.service'
import {
  buscarAgendaProfissional,
  substituirExcecoesAgenda,
} from '../services/health-professionals.service'
import {
  CLINICAL_APPOINTMENT_STATUSES,
  CLINICAL_APPOINTMENT_STATUS_CORES,
  CLINICAL_APPOINTMENT_STATUS_LABELS,
  CLINICAL_APPOINTMENT_TYPES,
  CLINICAL_APPOINTMENT_TYPE_CORES,
  CLINICAL_APPOINTMENT_TYPE_LABELS,
  idsAvulsosDoAgendamento,
  idsGuiasDoAgendamento,
  idsItensPacoteDoAgendamento,
  usosCartaoDoAgendamento,
  type ClinicalAppointment,
  type ClinicalAppointmentStatus,
  type ClinicalAppointmentType,
  type CreateClinicalAppointmentRequest,
  type UpdateClinicalAppointmentRequest,
} from '../types/agendamentoClinico'
import type { Patient } from '../types/paciente'
import type { HealthProfessional } from '../types/profissional'
import type { ProfessionalScheduleDay, ScheduleExceptionInput } from '../types/bloqueioHorario'
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
  ultimoDiaDoMes,
  ymdEmSaoPaulo,
} from '../utils/dataHoraSaoPaulo'

function intervaloVisivel(visao: VisaoTela, dataRef: string): { from: string; to: string } {
  if (visao === 'dia') return { from: dataRef, to: dataRef }
  if (visao === 'semana') return { from: segundaDaSemana(dataRef), to: domingoDaSemana(dataRef) }
  const grade = gradeDoMes(dataRef)
  if (visao === 'mes') return { from: grade[0], to: grade[grade.length - 1] }
  return { from: primeiroDiaDoMes(dataRef), to: ultimoDiaDoMes(dataRef) }
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
  return {
    patientId: values.patientId,
    healthProfessionalId: values.healthProfessionalId,
    scheduledAt,
    endsAt,
    status: values.status,
    ...(values.procedureIds.length > 0 ? { procedureIds: values.procedureIds } : {}),
    ...(values.patientPackageItemIds.length > 0
      ? { patientPackageItemIds: values.patientPackageItemIds }
      : {}),
    ...(values.benefitUses.length > 0 ? { benefitUses: values.benefitUses } : {}),
    ...(values.insuranceGuideIds.length > 0 ? { insuranceGuideIds: values.insuranceGuideIds } : {}),
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
  const payload: UpdateClinicalAppointmentRequest = {
    patientId: values.patientId,
    healthProfessionalId: values.healthProfessionalId,
    scheduledAt,
    endsAt,
    status: values.status,
    notes: notesDoFormulario(values),
  }

  if (!idsIguais(values.procedureIds, idsAvulsosDoAgendamento(atual))) {
    payload.procedureIds = values.procedureIds
  }
  if (!idsIguais(values.patientPackageItemIds, idsItensPacoteDoAgendamento(atual))) {
    payload.patientPackageItemIds = values.patientPackageItemIds
  }
  const usosAtuais = usosCartaoDoAgendamento(atual)
  const usosIguais =
    values.benefitUses.length === usosAtuais.length &&
    values.benefitUses.every((uso) =>
      usosAtuais.some(
        (atualUso) =>
          atualUso.entitlementId === uso.entitlementId && atualUso.procedureId === uso.procedureId,
      ),
    )
  if (!usosIguais) {
    payload.benefitUses = values.benefitUses
  }
  if (!idsIguais(values.insuranceGuideIds, idsGuiasDoAgendamento(atual))) {
    payload.insuranceGuideIds = values.insuranceGuideIds
  }

  return payload
}

export function AgendaClinicaPage() {
  const [visao, setVisao] = useState<VisaoTela>('semana')
  const [dataRef, setDataRef] = useState(() => ymdEmSaoPaulo())
  const [agendamentos, setAgendamentos] = useState<ClinicalAppointment[]>([])
  const [diasAgenda, setDiasAgenda] = useState<ProfessionalScheduleDay[]>([])
  const [ajusteDia, setAjusteDia] = useState<string | null>(null)
  const [salvandoBloqueio, setSalvandoBloqueio] = useState(false)
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

  const { from, to } = useMemo(() => intervaloVisivel(visao, dataRef), [visao, dataRef])
  const filtroPacienteId = filtroPaciente?.id ?? ''
  const filtroProfissionalId = filtroProfissional?.id ?? ''
  const filtroAgendaAtivo = filtroPacienteId !== '' || filtroProfissionalId !== ''

  const carregarAgendamentos = useCallback(async () => {
    if (!filtroAgendaAtivo) {
      setAgendamentos([])
      setDiasAgenda([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const agendaPromise =
        filtroProfissionalId === ''
          ? Promise.resolve(null)
          : buscarAgendaProfissional(filtroProfissionalId, from, to)
      const [data, agenda] = await Promise.all([
        listarAgendamentosClinicos({
          from,
          to,
          ...(filtroPacienteId === '' ? {} : { patientId: filtroPacienteId }),
          ...(filtroProfissionalId === '' ? {} : { healthProfessionalId: filtroProfissionalId }),
          ...(filtroTipo === '' ? {} : { type: filtroTipo }),
          ...(filtroStatus === '' ? {} : { status: filtroStatus }),
        }),
        agendaPromise,
      ])
      setAgendamentos(data)
      setDiasAgenda(agenda?.days ?? [])
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

  function fecharAlerta() {
    setError(null)
    setSuccess(null)
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
  const bloqueiosPorDia = useMemo(() => {
    const mapa: Record<string, ProfessionalScheduleDay['effectiveBlocks']> = {}
    if (!filtroProfissional) return mapa
    for (const dia of diasAgenda) mapa[dia.date] = dia.effectiveBlocks
    return mapa
  }, [diasAgenda, filtroProfissional])
  const diaEmAjuste = diasAgenda.find((dia) => dia.date === ajusteDia) ?? null
  const podeAjustarBloqueio = Boolean(filtroProfissional) && (visao === 'dia' || visao === 'semana')

  async function salvarExcecoes(exceptions: ScheduleExceptionInput[]) {
    if (!filtroProfissional || !ajusteDia) return
    setSalvandoBloqueio(true)
    setError(null)
    setSuccess(null)
    try {
      await substituirExcecoesAgenda(filtroProfissional.id, { date: ajusteDia, exceptions })
      setAjusteDia(null)
      setSuccess('Bloqueio do dia atualizado.')
      await carregarAgendamentos()
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível atualizar o bloqueio do dia.'))
    } finally {
      setSalvandoBloqueio(false)
    }
  }

  return (
    <Box>
      <Box
        sx={{
          position: 'sticky',
          top: TOP_BAR_HEIGHT,
          zIndex: 12,
          bgcolor: 'grey.100',
        }}
      >
        <AgendaClinicaToolbar
          visao={visao}
          onVisaoChange={setVisao}
          dataRef={dataRef}
          onDataRefChange={setDataRef}
          onHoje={irHoje}
          onAnterior={irAnterior}
          onProximo={irProximo}
          filtroPaciente={filtroPaciente}
          onFiltroPacienteChange={setFiltroPaciente}
          filtroProfissional={filtroProfissional}
          onFiltroProfissionalChange={setFiltroProfissional}
          filtroTipo={filtroTipo}
          onFiltroTipoChange={setFiltroTipo}
          filtroStatus={filtroStatus}
          onFiltroStatusChange={setFiltroStatus}
          onNovoAgendamento={() => abrirNovo()}
        />

        {calendarioVisivel ? (
          <Paper
            sx={{
              mt: 1,
              p: 1,
              pb: 0,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
            }}
          >
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
            <AgendaClinicaCabecalho
              visao={visaoCalendario}
              dataRef={dataRef}
              onAjustarBloqueio={podeAjustarBloqueio ? setAjusteDia : undefined}
            />
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
            bloqueiosPorDia={bloqueiosPorDia}
            onSlotClick={(ymd, hm) => abrirNovo(ymd, hm)}
            onSlotBloqueado={() => {
              setSuccess(null)
              setError('Horário bloqueado.')
            }}
            onEventoClick={abrirEvento}
            onDiaClick={(ymd) => {
              setDataRef(ymd)
              setVisao('dia')
            }}
          />
        </Paper>
      )}

      <Snackbar
        open={Boolean(error || success)}
        autoHideDuration={6000}
        onClose={(_event, reason) => {
          if (reason === 'clickaway') return
          fecharAlerta()
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ position: 'fixed', zIndex: 0 }}
      >
        <Alert
          severity={error ? 'error' : 'success'}
          variant="filled"
          onClose={fecharAlerta}
          sx={{ width: '100%' }}
        >
          {error ?? success}
        </Alert>
      </Snackbar>

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
                        procedureIds: idsAvulsosDoAgendamento(editando),
                        patientPackageItemIds: idsItensPacoteDoAgendamento(editando),
                        benefitUses: usosCartaoDoAgendamento(editando),
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
                        procedureIds: [],
                        patientPackageItemIds: [],
                        benefitUses: [],
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

      <AjusteBloqueioDiaDialog
        open={Boolean(ajusteDia) && Boolean(filtroProfissional)}
        profissionalNome={filtroProfissional?.name ?? ''}
        dia={diaEmAjuste}
        saving={salvandoBloqueio}
        onClose={() => {
          if (salvandoBloqueio) return
          setAjusteDia(null)
        }}
        onSave={(exceptions) => void salvarExcecoes(exceptions)}
      />
    </Box>
  )
}
