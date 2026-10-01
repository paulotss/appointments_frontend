import { zodResolver } from '@hookform/resolvers/zod'
import AddIcon from '@mui/icons-material/Add'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import {
  Alert,
  Autocomplete,
  Button,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm, useWatch, type DefaultValues } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { GuiaProcedimentosTabela } from './GuiaProcedimentosTabela'
import { NovaGuiaDialog } from './NovaGuiaDialog'
import { CampoData } from './CampoData'
import { PacienteBuscaAutocomplete } from './PacienteBuscaAutocomplete'
import { ProfissionalBuscaAutocomplete } from './ProfissionalBuscaAutocomplete'
import {
  agendamentoClinicoSchema,
  type AgendamentoClinicoFormInput,
  type AgendamentoClinicoFormValues,
} from '../schemas/agendamentoClinico.schema'
import { listarAgendamentosClinicos } from '../services/clinical-appointments.service'
import { buscarGuia, listarGuias } from '../services/insurance-guides.service'
import { listarProcedimentosPorEspecialidades } from '../services/procedures.service'
import { listarPacotesDoPaciente } from '../services/patient-packages.service'
import { buscarPaciente } from '../services/patients.service'
import { buscarProfissional } from '../services/health-professionals.service'
import {
  CLINICAL_APPOINTMENT_STATUSES,
  CLINICAL_APPOINTMENT_STATUS_LABELS,
  guiasDoAgendamento,
  temAvulsoParaCobrar,
  type ClinicalAppointment,
} from '../types/agendamentoClinico'
import type { InsuranceGuide } from '../types/guia'
import { rotuloGuia, saldoGuiaProcedimento } from '../types/guia'
import type { Patient } from '../types/paciente'
import type { PatientPackage, PatientPackageItem } from '../types/pacote'
import type { Procedure } from '../types/procedimento'
import type { HealthProfessional } from '../types/profissional'
import { formatarMoedaBRL } from '../utils/moedaBRL'
import {
  agendamentoReservaSaldoGuia,
  guiaElegivelParaAgendamento,
  guiaTemSaldoLivreParaAgendamento,
  linhasProcedimentosDasGuias,
  mensagemSaldoReservadoEmAgendamentos,
  reservasPorGuiaAPartirDeIds,
} from '../utils/saldoGuia'

interface AgendamentoClinicoFormProps {
  defaultValues: DefaultValues<AgendamentoClinicoFormInput>
  pacientes: Patient[]
  profissionais: HealthProfessional[]
  loading: boolean
  submitLabel: string
  agendamentoAtual?: ClinicalAppointment | null
  onSubmit: (values: AgendamentoClinicoFormValues) => void
  onCancel?: () => void
  onExcluir?: () => void
}

export function AgendamentoClinicoForm({
  defaultValues,
  pacientes,
  profissionais,
  loading,
  submitLabel,
  agendamentoAtual = null,
  onSubmit,
  onCancel,
  onExcluir,
}: AgendamentoClinicoFormProps) {
  const navigate = useNavigate()
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AgendamentoClinicoFormInput, unknown, AgendamentoClinicoFormValues>({
    resolver: zodResolver(agendamentoClinicoSchema),
    defaultValues,
  })

  const patientId = useWatch({ control, name: 'patientId' })
  const healthProfessionalId = useWatch({ control, name: 'healthProfessionalId' })
  const insuranceGuideIds = useWatch({ control, name: 'insuranceGuideIds' }) ?? []
  const patientPackageItemIds = useWatch({ control, name: 'patientPackageItemIds' }) ?? []
  const status = useWatch({ control, name: 'status' })

  const [procedimentos, setProcedimentos] = useState<Procedure[]>([])
  const [guias, setGuias] = useState<InsuranceGuide[]>([])
  const [pacotesPaciente, setPacotesPaciente] = useState<PatientPackage[]>([])
  const [idsReservasPorGuia, setIdsReservasPorGuia] = useState<Record<number, number[]>>({})
  const [loadingListas, setLoadingListas] = useState(false)
  const [dialogNovaGuiaAberto, setDialogNovaGuiaAberto] = useState(false)
  const [pacienteSelecionado, setPacienteSelecionado] = useState<Patient | null>(
    () => pacientes.find((item) => item.id === defaultValues.patientId) ?? null,
  )
  const [profissionalSelecionado, setProfissionalSelecionado] = useState<HealthProfessional | null>(
    () => profissionais.find((item) => item.id === defaultValues.healthProfessionalId) ?? null,
  )

  const profissionaisAtivos = useMemo(() => {
    const lista = [profissionalSelecionado, ...profissionais].filter(
      (item): item is HealthProfessional => Boolean(item),
    )
    return lista.filter((item) => item.isActive || item.id === healthProfessionalId)
  }, [profissionais, profissionalSelecionado, healthProfessionalId])

  const profissional =
    profissionalSelecionado?.id === healthProfessionalId
      ? profissionalSelecionado
      : profissionais.find((item) => item.id === healthProfessionalId)
  const specialtyIds = profissional?.specialties.map((item) => item.specialtyId) ?? []

  const guiasDoAtual = useMemo(
    () => (agendamentoAtual ? guiasDoAgendamento(agendamentoAtual) : []),
    [agendamentoAtual],
  )

  const guiasSelecionadas = useMemo(() => {
    const porId = new Map<number, InsuranceGuide>()
    for (const guia of [...guias, ...guiasDoAtual]) {
      porId.set(guia.id, guia)
    }
    return insuranceGuideIds
      .map((id) => porId.get(id))
      .filter((guia): guia is InsuranceGuide => Boolean(guia))
  }, [guias, guiasDoAtual, insuranceGuideIds])

  const reservasPorGuia = useMemo(
    () => reservasPorGuiaAPartirDeIds(idsReservasPorGuia, agendamentoAtual?.id),
    [idsReservasPorGuia, agendamentoAtual?.id],
  )

  const guiasComSaldoReservado = useMemo(
    () =>
      guias.filter(
        (guia) =>
          guiaElegivelParaAgendamento(guia) &&
          !insuranceGuideIds.includes(guia.id) &&
          !guiaTemSaldoLivreParaAgendamento(guia, reservasPorGuia),
      ),
    [guias, insuranceGuideIds, reservasPorGuia],
  )

  const avisoSaldoReservado = useMemo(
    () => mensagemSaldoReservadoEmAgendamentos(guiasComSaldoReservado),
    [guiasComSaldoReservado],
  )

  const procedimentosSemSaldo = useMemo(() => {
    if (guiasSelecionadas.length === 0) return []
    return linhasProcedimentosDasGuias(guiasSelecionadas).filter(
      (item) => saldoGuiaProcedimento(item) <= 0,
    )
  }, [guiasSelecionadas])

  const finishedDesabilitado =
    insuranceGuideIds.length > 0 &&
    !(agendamentoAtual?.status === 'finished' && status === 'finished') &&
    procedimentosSemSaldo.length > 0

  const guiaSomenteLeitura = status === 'finished' && insuranceGuideIds.length > 0

  const mensagemFinished =
    procedimentosSemSaldo.length > 0
      ? `Procedimento ${
          procedimentosSemSaldo[0]?.procedure?.name ?? procedimentosSemSaldo[0]?.procedureId
        } sem quantidade disponível na guia #${procedimentosSemSaldo[0]?.guia.id}`
      : null

  const opcoesGuias = useMemo(() => {
    const porId = new Map<number, InsuranceGuide>()
    for (const guia of [...guias, ...guiasSelecionadas]) {
      porId.set(guia.id, guia)
    }
    return Array.from(porId.values()).filter(
      (guia) =>
        insuranceGuideIds.includes(guia.id) ||
        guiaTemSaldoLivreParaAgendamento(guia, reservasPorGuia),
    )
  }, [guias, guiasSelecionadas, insuranceGuideIds, reservasPorGuia])

  const itensPacote = useMemo(() => {
    const linhas: Array<PatientPackageItem & { pacoteNome: string; ativo: boolean }> = []
    for (const pacote of pacotesPaciente) {
      for (const item of pacote.items) {
        linhas.push({
          ...item,
          pacoteNome: pacote.package?.name ?? `Pacote #${pacote.packageId}`,
          ativo: pacote.status === 'active',
        })
      }
    }
    return linhas
  }, [pacotesPaciente])

  const opcoesPacote = useMemo(() => {
    return itensPacote.filter(
      (item) =>
        patientPackageItemIds.includes(item.id) ||
        (item.ativo && item.remainingQuantity > 0),
    )
  }, [itensPacote, patientPackageItemIds])

  useEffect(() => {
    async function carregarProcedimentos() {
      if (specialtyIds.length === 0) {
        setProcedimentos([])
        return
      }
      setLoadingListas(true)
      try {
        const data = await listarProcedimentosPorEspecialidades(specialtyIds)
        setProcedimentos(data)
      } catch {
        setProcedimentos([])
      } finally {
        setLoadingListas(false)
      }
    }
    void carregarProcedimentos()
    // specialtyIds is derived from healthProfessionalId
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [healthProfessionalId])

  useEffect(() => {
    async function carregarGuias() {
      if (patientId == null || healthProfessionalId == null) {
        setGuias([])
        setIdsReservasPorGuia({})
        return
      }
      setLoadingListas(true)
      try {
        const data = await listarGuias({
          patientId,
          healthProfessionalId,
          isBilled: false,
          limit: 100,
        })
        const elegiveis = data.data.filter(guiaElegivelParaAgendamento)
        const faltando = insuranceGuideIds.filter((id) => !elegiveis.some((item) => item.id === id))
        let guiasCarregadas = elegiveis
        if (faltando.length > 0) {
          const extras = await Promise.all(faltando.map((id) => buscarGuia(id).catch(() => null)))
          const encontrados = extras.filter((item): item is InsuranceGuide => item != null)
          const porId = new Map<number, InsuranceGuide>()
          for (const item of [...encontrados, ...elegiveis]) {
            porId.set(item.id, item)
          }
          guiasCarregadas = Array.from(porId.values())
        }
        setGuias(guiasCarregadas)

        const idsParaContar = [...new Set(guiasCarregadas.map((item) => item.id))]
        const reservas: Record<number, number[]> = {}
        await Promise.all(
          idsParaContar.map(async (guiaId) => {
            const agendamentos = await listarAgendamentosClinicos({
              insuranceGuideId: guiaId,
              from: '2000-01-01',
              to: '2099-12-31',
            }).catch(() => [] as ClinicalAppointment[])
            reservas[guiaId] = agendamentos
              .filter((item) => agendamentoReservaSaldoGuia(item))
              .map((item) => item.id)
          }),
        )
        setIdsReservasPorGuia(reservas)
      } catch {
        setGuias([])
        setIdsReservasPorGuia({})
      } finally {
        setLoadingListas(false)
      }
    }
    void carregarGuias()
    // Recarrega ao mudar paciente/profissional; ids já selecionados entram via fallback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, healthProfessionalId])

  useEffect(() => {
    async function carregarPacotes() {
      if (patientId == null) {
        setPacotesPaciente([])
        return
      }
      try {
        setPacotesPaciente(await listarPacotesDoPaciente(patientId, agendamentoAtual?.id))
      } catch {
        setPacotesPaciente([])
      }
    }
    void carregarPacotes()
  }, [patientId, agendamentoAtual?.id])

  useEffect(() => {
    setDialogNovaGuiaAberto(false)
  }, [patientId, healthProfessionalId])

  useEffect(() => {
    const patientIdInicial = defaultValues.patientId
    if (typeof patientIdInicial !== 'number' || pacienteSelecionado?.id === patientIdInicial) return
    void buscarPaciente(patientIdInicial)
      .then((paciente) => setPacienteSelecionado(paciente))
      .catch(() => undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValues.patientId])

  useEffect(() => {
    const professionalIdInicial = defaultValues.healthProfessionalId
    if (
      typeof professionalIdInicial !== 'number' ||
      profissionalSelecionado?.id === professionalIdInicial
    )
      return
    void buscarProfissional(professionalIdInicial)
      .then((profissional) => setProfissionalSelecionado(profissional))
      .catch(() => undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValues.healthProfessionalId])

  return (
    <Stack component="form" spacing={2} onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="patientId"
        control={control}
        render={({ field: { onChange, value, ref, onBlur } }) => (
          <PacienteBuscaAutocomplete
            value={
              pacienteSelecionado?.id === value
                ? pacienteSelecionado
                : pacientes.find((paciente) => paciente.id === value) ?? null
            }
            onChange={(paciente) => {
              setPacienteSelecionado(paciente)
              onChange(paciente?.id)
              setValue('insuranceGuideIds', [])
              setValue('patientPackageItemIds', [])
            }}
            onBlur={onBlur}
            inputRef={ref}
            error={Boolean(errors.patientId)}
            helperText={errors.patientId?.message}
          />
        )}
      />

      <Controller
        name="healthProfessionalId"
        control={control}
        render={({ field: { onChange, value, ref, onBlur } }) => (
          <ProfissionalBuscaAutocomplete
            value={
              profissionalSelecionado?.id === value
                ? profissionalSelecionado
                : profissionaisAtivos.find((item) => item.id === value) ?? null
            }
            onChange={(profissional) => {
              setProfissionalSelecionado(profissional)
              onChange(profissional?.id)
              setValue('procedureIds', [])
              setValue('insuranceGuideIds', [])
            }}
            onBlur={onBlur}
            inputRef={ref}
            somenteAtivos
            error={Boolean(errors.healthProfessionalId)}
            helperText={errors.healthProfessionalId?.message}
          />
        )}
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <Controller
          name="scheduledDate"
          control={control}
          render={({ field }) => (
            <CampoData
              label="Data"
              value={field.value}
              onChange={field.onChange}
              error={Boolean(errors.scheduledDate)}
              helperText={errors.scheduledDate?.message ?? ' '}
              fullWidth
            />
          )}
        />
        <Controller
          name="scheduledTime"
          control={control}
          render={({ field }) => (
            <TextField
              label="Horário"
              type="time"
              inputProps={{ step: 1800 }}
              InputLabelProps={{ shrink: true }}
              value={field.value}
              onChange={field.onChange}
              error={Boolean(errors.scheduledTime)}
              helperText={errors.scheduledTime?.message ?? ' '}
              fullWidth
            />
          )}
        />
        <Controller
          name="durationMinutes"
          control={control}
          render={({ field }) => (
            <TextField
              label="Duração (min)"
              type="number"
              inputProps={{ min: 1, step: 1 }}
              InputLabelProps={{ shrink: true }}
              value={field.value ?? ''}
              onChange={(event) => {
                const raw = event.target.value
                field.onChange(raw === '' ? undefined : Number(raw))
              }}
              error={Boolean(errors.durationMinutes)}
              helperText={errors.durationMinutes?.message ?? ' '}
              fullWidth
            />
          )}
        />
      </Stack>

      <Controller
        name="status"
        control={control}
        render={({ field }) => (
          <TextField
            select
            label="Status"
            value={field.value}
            onChange={field.onChange}
            error={Boolean(errors.status)}
            helperText={
              mensagemFinished && field.value === 'finished'
                ? mensagemFinished
                : (errors.status?.message ?? ' ')
            }
          >
            {CLINICAL_APPOINTMENT_STATUSES.map((item) => (
              <MenuItem key={item} value={item} disabled={item === 'finished' && finishedDesabilitado}>
                {CLINICAL_APPOINTMENT_STATUS_LABELS[item]}
              </MenuItem>
            ))}
          </TextField>
        )}
      />
      {mensagemFinished ? <Alert severity="warning">{mensagemFinished}</Alert> : null}

      <Typography variant="subtitle2">Procedimentos avulsos</Typography>
      <Controller
        name="procedureIds"
        control={control}
        render={({ field: { onChange, value, ref, onBlur } }) => (
          <Autocomplete
            multiple
            options={procedimentos}
            getOptionLabel={(item) => `${item.name} — ${formatarMoedaBRL(item.value) || 's/ valor'}`}
            isOptionEqualToValue={(option, selected) => option.id === selected.id}
            value={procedimentos.filter((item) => (value ?? []).includes(item.id))}
            onChange={(_, selected) => onChange(selected.map((item) => item.id))}
            onBlur={onBlur}
            loading={loadingListas}
            disabled={specialtyIds.length === 0}
            renderInput={(params) => (
              <TextField
                {...params}
                inputRef={ref}
                label="Avulsos (preço cheio)"
                error={Boolean(errors.procedureIds)}
                helperText={
                  errors.procedureIds?.message ??
                  (healthProfessionalId == null
                    ? 'Selecione o profissional para listar os procedimentos.'
                    : 'Opcional. Será cobrado na entrada financeira do agendamento.')
                }
              />
            )}
          />
        )}
      />

      <Typography variant="subtitle2">Pacote do paciente</Typography>
      <Controller
        name="patientPackageItemIds"
        control={control}
        render={({ field: { onChange, value, ref, onBlur } }) => (
          <Autocomplete
            multiple
            options={opcoesPacote}
            getOptionLabel={(item) =>
              `${item.procedure?.name ?? `Procedimento #${item.procedureId}`} · ${item.pacoteNome} · restante ${item.remainingQuantity} de ${item.quantity}`
            }
            isOptionEqualToValue={(option, selected) => option.id === selected.id}
            value={opcoesPacote.filter((item) => (value ?? []).includes(item.id))}
            onChange={(_, selected) => onChange(selected.map((item) => item.id))}
            onBlur={onBlur}
            disabled={patientId == null}
            renderInput={(params) => (
              <TextField
                {...params}
                inputRef={ref}
                label="Procedimentos do pacote"
                error={Boolean(errors.patientPackageItemIds)}
                helperText={
                  errors.patientPackageItemIds?.message ??
                  (patientId == null
                    ? 'Selecione o paciente para listar os pacotes.'
                    : opcoesPacote.length === 0
                      ? 'Este paciente não tem saldo de pacote disponível.'
                      : 'Já pagos na atribuição. Consomem 1 sessão ao finalizar.')
                }
              />
            )}
          />
        )}
      />

      <Typography variant="subtitle2">Plano de saúde</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'flex-start' }}>
        <Controller
          name="insuranceGuideIds"
          control={control}
          render={({ field: { onChange, value, ref, onBlur } }) => (
            <Autocomplete
              multiple
              options={opcoesGuias}
              getOptionLabel={(guia) => rotuloGuia(guia)}
              isOptionEqualToValue={(option, selected) => option.id === selected.id}
              value={opcoesGuias.filter((guia) => (value ?? []).includes(guia.id))}
              onChange={(_, selected) => onChange(selected.map((guia) => guia.id))}
              onBlur={onBlur}
              loading={loadingListas}
              disabled={guiaSomenteLeitura || patientId == null || healthProfessionalId == null}
              sx={{ flex: 1 }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  inputRef={ref}
                  label="Guias"
                  error={Boolean(errors.insuranceGuideIds)}
                  helperText={
                    errors.insuranceGuideIds?.message ??
                    (guiaSomenteLeitura
                      ? 'As guias não podem ser alteradas enquanto o status for Finalizado.'
                      : patientId == null || healthProfessionalId == null
                        ? 'Selecione paciente e profissional para listar as guias.'
                        : opcoesGuias.length === 0
                          ? 'Nenhuma guia com quantidade disponível. Use Nova guia para cadastrar.'
                          : 'Opcional. Somente guias não faturadas com saldo livre.')
                  }
                />
              )}
            />
          )}
        />
        <Button
          type="button"
          variant="outlined"
          startIcon={<AddIcon />}
          disabled={guiaSomenteLeitura || patientId == null || healthProfessionalId == null}
          onClick={() => setDialogNovaGuiaAberto(true)}
          sx={{ mt: { sm: 0.5 }, whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          Nova guia
        </Button>
      </Stack>
      {avisoSaldoReservado ? <Alert severity="warning">{avisoSaldoReservado}</Alert> : null}
      {patientId != null && healthProfessionalId != null ? (
        <NovaGuiaDialog
          open={dialogNovaGuiaAberto}
          patientId={patientId}
          healthProfessionalId={healthProfessionalId}
          pacientes={pacienteSelecionado ? [pacienteSelecionado] : pacientes}
          profissionais={profissional ? [profissional] : profissionais}
          onClose={() => setDialogNovaGuiaAberto(false)}
          onCreated={(guia) => {
            setGuias((prev) => {
              if (prev.some((item) => item.id === guia.id)) return prev
              return [guia, ...prev]
            })
            if (!insuranceGuideIds.includes(guia.id)) {
              setValue('insuranceGuideIds', [...insuranceGuideIds, guia.id], {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
          }}
        />
      ) : null}
      {loadingListas ? (
        <Stack direction="row" alignItems="center" gap={1}>
          <CircularProgress size={16} />
        </Stack>
      ) : null}
      <GuiaProcedimentosTabela
        procedimentos={linhasProcedimentosDasGuias(guiasSelecionadas).map((item) => ({
          ...item,
          guiaLabel: rotuloGuia(item.guia),
          healthPlanId: item.guia.healthPlanId,
        }))}
        emptyText="Selecione as guias para ver os procedimentos (somente leitura)."
      />

      <Controller
        name="notes"
        control={control}
        render={({ field }) => (
          <TextField
            label="Observações"
            multiline
            minRows={2}
            value={field.value ?? ''}
            onChange={field.onChange}
            onBlur={field.onBlur}
            inputRef={field.ref}
            error={Boolean(errors.notes)}
            helperText={errors.notes?.message ?? ' '}
          />
        )}
      />

      <Stack direction="row" spacing={1} justifyContent="flex-end">
        {onExcluir ? (
          <Button color="error" onClick={onExcluir} disabled={loading} sx={{ mr: 'auto' }}>
            Excluir
          </Button>
        ) : null}
        {agendamentoAtual &&
        temAvulsoParaCobrar(agendamentoAtual) &&
        agendamentoAtual.status === 'finished' ? (
          <Button
            startIcon={<ReceiptLongIcon />}
            onClick={() =>
              navigate(`/financeiro/entradas/nova?agendamentoId=${agendamentoAtual.id}`)
            }
            disabled={loading}
            sx={onExcluir ? undefined : { mr: 'auto' }}
          >
            Registrar entrada
          </Button>
        ) : null}
        {onCancel ? (
          <Button onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
        ) : null}
        <Button
          type="submit"
          variant="contained"
          disabled={loading || (status === 'finished' && finishedDesabilitado)}
        >
          {loading ? 'Salvando...' : submitLabel}
        </Button>
      </Stack>
    </Stack>
  )
}
