import { zodResolver } from '@hookform/resolvers/zod'
import AddIcon from '@mui/icons-material/Add'
import {
  Alert,
  Autocomplete,
  Button,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm, useWatch, type DefaultValues } from 'react-hook-form'
import { GuiaProcedimentosTabela } from './GuiaProcedimentosTabela'
import { NovaGuiaDialog } from './NovaGuiaDialog'
import {
  agendamentoClinicoSchema,
  type AgendamentoClinicoFormInput,
  type AgendamentoClinicoFormValues,
} from '../schemas/agendamentoClinico.schema'
import { buscarGuia, listarGuias } from '../services/insurance-guides.service'
import { listarProcedimentosPorEspecialidades } from '../services/procedures.service'
import {
  CLINICAL_APPOINTMENT_STATUSES,
  CLINICAL_APPOINTMENT_STATUS_LABELS,
  guiasDoAgendamento,
  type ClinicalAppointment,
} from '../types/agendamentoClinico'
import type { InsuranceGuide } from '../types/guia'
import { rotuloGuia, saldoGuiaProcedimento } from '../types/guia'
import type { Patient } from '../types/paciente'
import type { Procedure } from '../types/procedimento'
import type { HealthProfessional } from '../types/profissional'
import { formatarMoedaBRL } from '../utils/moedaBRL'
import { linhasProcedimentosDasGuias } from '../utils/saldoGuia'

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
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AgendamentoClinicoFormInput, unknown, AgendamentoClinicoFormValues>({
    resolver: zodResolver(agendamentoClinicoSchema),
    defaultValues,
  })

  const type = useWatch({ control, name: 'type' })
  const patientId = useWatch({ control, name: 'patientId' })
  const healthProfessionalId = useWatch({ control, name: 'healthProfessionalId' })
  const insuranceGuideIds = useWatch({ control, name: 'insuranceGuideIds' }) ?? []
  const status = useWatch({ control, name: 'status' })

  const [procedimentos, setProcedimentos] = useState<Procedure[]>([])
  const [guias, setGuias] = useState<InsuranceGuide[]>([])
  const [loadingListas, setLoadingListas] = useState(false)
  const [dialogNovaGuiaAberto, setDialogNovaGuiaAberto] = useState(false)

  const profissionaisAtivos = useMemo(
    () => profissionais.filter((item) => item.isActive || item.id === healthProfessionalId),
    [profissionais, healthProfessionalId],
  )

  const profissional = profissionais.find((item) => item.id === healthProfessionalId)
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

  const procedimentosSemSaldo = useMemo(() => {
    if (type !== 'health_plan' || guiasSelecionadas.length === 0) return []
    return linhasProcedimentosDasGuias(guiasSelecionadas).filter(
      (item) => saldoGuiaProcedimento(item) <= 0,
    )
  }, [type, guiasSelecionadas])

  const finishedDesabilitado =
    type === 'health_plan' &&
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
    return Array.from(porId.values())
  }, [guias, guiasSelecionadas])

  useEffect(() => {
    async function carregarProcedimentos() {
      if (type !== 'private' || specialtyIds.length === 0) {
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
  }, [type, healthProfessionalId])

  useEffect(() => {
    async function carregarGuias() {
      if (type !== 'health_plan' || patientId == null || healthProfessionalId == null) {
        setGuias([])
        return
      }
      setLoadingListas(true)
      try {
        const data = await listarGuias({
          patientId,
          healthProfessionalId,
          isBilled: false,
        })
        const elegiveis = data.filter((item) => item.procedures.length > 0)
        const faltando = insuranceGuideIds.filter((id) => !elegiveis.some((item) => item.id === id))
        if (faltando.length > 0) {
          const extras = await Promise.all(
            faltando.map((id) => buscarGuia(id).catch(() => null)),
          )
          const encontrados = extras.filter((item): item is InsuranceGuide => item != null)
          const porId = new Map<number, InsuranceGuide>()
          for (const item of [...encontrados, ...elegiveis]) {
            porId.set(item.id, item)
          }
          setGuias(Array.from(porId.values()))
          return
        }
        setGuias(elegiveis)
      } catch {
        setGuias([])
      } finally {
        setLoadingListas(false)
      }
    }
    void carregarGuias()
    // Recarrega ao mudar paciente/profissional/tipo; ids já selecionados entram via fallback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, patientId, healthProfessionalId])

  useEffect(() => {
    setDialogNovaGuiaAberto(false)
  }, [type, patientId, healthProfessionalId])

  return (
    <Stack component="form" spacing={2} onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="type"
        control={control}
        render={({ field }) => (
          <ToggleButtonGroup
            exclusive
            fullWidth
            value={field.value}
            onChange={(_, value) => {
              if (!value) return
              field.onChange(value)
              if (value === 'private') {
                setValue('insuranceGuideIds', [])
              } else {
                setValue('procedureIds', [])
              }
            }}
          >
            <ToggleButton value="private">Particular</ToggleButton>
            <ToggleButton value="health_plan">Plano de saúde</ToggleButton>
          </ToggleButtonGroup>
        )}
      />

      <Controller
        name="patientId"
        control={control}
        render={({ field: { onChange, value, ref, onBlur } }) => (
          <Autocomplete
            options={pacientes}
            getOptionLabel={(paciente) => paciente.name}
            isOptionEqualToValue={(option, selected) => option.id === selected.id}
            value={pacientes.find((paciente) => paciente.id === value) ?? null}
            onChange={(_, paciente) => {
              onChange(paciente?.id)
              setValue('insuranceGuideIds', [])
            }}
            onBlur={onBlur}
            renderInput={(params) => (
              <TextField
                {...params}
                inputRef={ref}
                label="Paciente"
                error={Boolean(errors.patientId)}
                helperText={errors.patientId?.message}
              />
            )}
          />
        )}
      />

      <Controller
        name="healthProfessionalId"
        control={control}
        render={({ field: { onChange, value, ref, onBlur } }) => (
          <Autocomplete
            options={profissionaisAtivos}
            getOptionLabel={(profissional) => profissional.name}
            isOptionEqualToValue={(option, selected) => option.id === selected.id}
            value={profissionaisAtivos.find((item) => item.id === value) ?? null}
            onChange={(_, profissional) => {
              onChange(profissional?.id)
              setValue('procedureIds', [])
              setValue('insuranceGuideIds', [])
            }}
            onBlur={onBlur}
            renderInput={(params) => (
              <TextField
                {...params}
                inputRef={ref}
                label="Profissional"
                error={Boolean(errors.healthProfessionalId)}
                helperText={errors.healthProfessionalId?.message}
              />
            )}
          />
        )}
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <Controller
          name="scheduledDate"
          control={control}
          render={({ field }) => (
            <TextField
              label="Data"
              type="date"
              InputLabelProps={{ shrink: true }}
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
              InputLabelProps={{ shrink: true }}
              value={field.value}
              onChange={field.onChange}
              error={Boolean(errors.scheduledTime)}
              helperText={errors.scheduledTime?.message ?? ' '}
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

      {type === 'private' ? (
        <Controller
          name="procedureIds"
          control={control}
          render={({ field: { onChange, value, ref, onBlur } }) => (
            <Autocomplete
              multiple
              options={procedimentos}
              getOptionLabel={(item) =>
                `${item.name} (${item.tissCode}) — ${formatarMoedaBRL(item.value) || 's/ valor'}`
              }
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
                  label="Procedimentos"
                  error={Boolean(errors.procedureIds)}
                  helperText={
                    errors.procedureIds?.message ??
                    (healthProfessionalId == null
                      ? 'Selecione o profissional para listar os procedimentos.'
                      : ' ')
                  }
                />
              )}
            />
          )}
        />
      ) : (
        <>
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
                              ? 'Nenhuma guia não faturada com procedimentos para este paciente e profissional. Use Nova guia para cadastrar.'
                              : 'Somente guias não faturadas deste paciente e profissional. Os procedimentos são copiados de todas as guias.')
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
          {patientId != null && healthProfessionalId != null ? (
            <NovaGuiaDialog
              open={dialogNovaGuiaAberto}
              patientId={patientId}
              healthProfessionalId={healthProfessionalId}
              pacientes={pacientes}
              profissionais={profissionais}
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
            }))}
            emptyText="Selecione as guias para ver os procedimentos (somente leitura)."
          />
        </>
      )}

      <Stack direction="row" spacing={1} justifyContent="flex-end">
        {onExcluir ? (
          <Button color="error" onClick={onExcluir} disabled={loading} sx={{ mr: 'auto' }}>
            Excluir
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
