import { zodResolver } from '@hookform/resolvers/zod'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import {
  Alert,
  Autocomplete,
  Button,
  CircularProgress,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useFieldArray, useForm, useWatch, type DefaultValues } from 'react-hook-form'
import { guiaSchema, type GuiaFormInput, type GuiaFormValues } from '../schemas/guia.schema'
import { listarProcedimentos } from '../services/procedures.service'
import { INSURANCE_GUIDE_STATUSES, INSURANCE_GUIDE_STATUS_LABELS } from '../types/guia'
import type { Patient } from '../types/paciente'
import type { HealthPlan } from '../types/planoSaude'
import type { Procedure } from '../types/procedimento'
import { tissCodeDoPlano, valorDoPlano } from '../types/procedimento'
import type { HealthProfessional } from '../types/profissional'
import { mensagemErroApi } from '../utils/apiError'
import { adicionarDiasISO } from '../utils/dataISO'
import { CampoValorMoeda } from './CampoValorMoeda'
import { PacienteBuscaAutocomplete } from './PacienteBuscaAutocomplete'
import { ProfissionalBuscaAutocomplete } from './ProfissionalBuscaAutocomplete'

interface GuiaFormProps {
  defaultValues: DefaultValues<GuiaFormInput>
  pacientes: Patient[]
  profissionais: HealthProfessional[]
  planos: HealthPlan[]
  loading: boolean
  submitLabel: string
  patientLocked?: boolean
  professionalLocked?: boolean
  onSubmit: (values: GuiaFormValues) => void
  onCancel?: () => void
}

export function GuiaForm({
  defaultValues,
  pacientes,
  profissionais,
  planos,
  loading,
  submitLabel,
  patientLocked = false,
  professionalLocked = false,
  onSubmit,
  onCancel,
}: GuiaFormProps) {
  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<GuiaFormInput, unknown, GuiaFormValues>({
    resolver: zodResolver(guiaSchema),
    defaultValues,
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'procedures' })
  const healthPlanId = useWatch({ control, name: 'healthPlanId' })
  const authorizationDate = useWatch({ control, name: 'authorizationDate' })
  const healthProfessionalId = useWatch({ control, name: 'healthProfessionalId' })
  const proceduresWatch = useWatch({ control, name: 'procedures' })

  const [procedimentosPlano, setProcedimentosPlano] = useState<Procedure[]>([])
  const [loadingProcedimentos, setLoadingProcedimentos] = useState(false)
  const [errorProcedimentos, setErrorProcedimentos] = useState<string | null>(null)

  const [pacienteSelecionado, setPacienteSelecionado] = useState<Patient | null>(
    () => pacientes.find((item) => item.id === defaultValues.patientId) ?? null,
  )
  const [profissionalSelecionado, setProfissionalSelecionado] = useState<HealthProfessional | null>(
    () => profissionais.find((item) => item.id === defaultValues.healthProfessionalId) ?? null,
  )

  const especialidadeIdsDoProfissional = useMemo(() => {
    const profissional =
      profissionalSelecionado ?? profissionais.find((item) => item.id === healthProfessionalId)
    return new Set((profissional?.specialties ?? []).map((item) => item.specialtyId))
  }, [profissionalSelecionado, profissionais, healthProfessionalId])

  const procedimentosElegiveis = useMemo(() => {
    if (especialidadeIdsDoProfissional.size === 0) return []
    return procedimentosPlano.filter((item) => especialidadeIdsDoProfissional.has(item.specialtyId))
  }, [procedimentosPlano, especialidadeIdsDoProfissional])

  const prazoPlano = planos.find((item) => item.id === healthPlanId)?.submissionDeadlineDays

  useEffect(() => {
    if (!authorizationDate || prazoPlano == null) return
    setValue('expirationDate', adicionarDiasISO(authorizationDate, prazoPlano))
  }, [authorizationDate, prazoPlano, setValue])

  useEffect(() => {
    const atuais = getValues('procedures') ?? []
    atuais.forEach((_, index) => {
      setValue(`procedures.${index}.value`, undefined as unknown as number)
    })
    async function carregarProcedimentos() {
      if (healthPlanId == null) {
        setProcedimentosPlano([])
        return
      }
      setLoadingProcedimentos(true)
      setErrorProcedimentos(null)
      try {
        const data = await listarProcedimentos({ healthPlanId })
        setProcedimentosPlano(data)
      } catch (err) {
        setErrorProcedimentos(mensagemErroApi(err, 'Não foi possível carregar os procedimentos do plano.'))
        setProcedimentosPlano([])
      } finally {
        setLoadingProcedimentos(false)
      }
    }
    void carregarProcedimentos()
  }, [healthPlanId, getValues, setValue])

  useEffect(() => {
    if (healthPlanId == null) return
    const atuais = getValues('procedures') ?? []
    atuais.forEach((item, index) => {
      if (item?.procedureId == null) return
      const atual = getValues(`procedures.${index}.value`)
      if (atual != null) return
      const proc = procedimentosPlano.find((p) => p.id === item.procedureId)
      const valor = valorDoPlano(proc, healthPlanId)
      if (valor != null) setValue(`procedures.${index}.value`, valor)
    })
  }, [healthPlanId, procedimentosPlano, getValues, setValue])

  return (
    <Stack component="form" spacing={2} onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="patientId"
        control={control}
        render={({ field: { onChange, value, ref, onBlur } }) => (
          <PacienteBuscaAutocomplete
            value={pacienteSelecionado?.id === value ? pacienteSelecionado : pacientes.find((item) => item.id === value) ?? null}
            onChange={(paciente) => {
              setPacienteSelecionado(paciente)
              onChange(paciente?.id)
            }}
            onBlur={onBlur}
            inputRef={ref}
            disabled={patientLocked}
            error={Boolean(errors.patientId)}
            helperText={errors.patientId?.message}
          />
        )}
      />
      <Controller
        name="healthPlanId"
        control={control}
        render={({ field: { onChange, value, ref, onBlur } }) => (
          <Autocomplete
            options={planos}
            getOptionLabel={(plano) => plano.name}
            isOptionEqualToValue={(option, selected) => option.id === selected.id}
            value={planos.find((plano) => plano.id === value) ?? null}
            onChange={(_, plano) => onChange(plano?.id)}
            onBlur={onBlur}
            renderInput={(params) => (
              <TextField
                {...params}
                inputRef={ref}
                label="Plano de saúde"
                error={Boolean(errors.healthPlanId)}
                helperText={errors.healthPlanId?.message}
              />
            )}
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
                : profissionais.find((item) => item.id === value) ?? null
            }
            onChange={(profissional) => {
              setProfissionalSelecionado(profissional)
              onChange(profissional?.id)
            }}
            onBlur={onBlur}
            inputRef={ref}
            disabled={professionalLocked}
            somenteAtivos
            error={Boolean(errors.healthProfessionalId)}
            helperText={errors.healthProfessionalId?.message}
          />
        )}
      />
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
            helperText={errors.status?.message ?? ' '}
          >
            {INSURANCE_GUIDE_STATUSES.map((status) => (
              <MenuItem key={status} value={status}>
                {INSURANCE_GUIDE_STATUS_LABELS[status]}
              </MenuItem>
            ))}
          </TextField>
        )}
      />
      <Controller
        name="guideNumber"
        control={control}
        render={({ field }) => (
          <TextField
            label="Número da guia"
            value={field.value ?? ''}
            onChange={field.onChange}
            onBlur={field.onBlur}
            inputRef={field.ref}
            error={Boolean(errors.guideNumber)}
            helperText={errors.guideNumber?.message ?? 'Opcional'}
          />
        )}
      />
      <Controller
        name="authorizationDate"
        control={control}
        render={({ field }) => (
          <TextField
            label="Data de autorização"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={field.value}
            onChange={field.onChange}
            error={Boolean(errors.authorizationDate)}
            helperText={errors.authorizationDate?.message ?? ' '}
          />
        )}
      />
      <Controller
        name="expirationDate"
        control={control}
        render={({ field }) => (
          <TextField
            label="Data de validade"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={field.value}
            onChange={field.onChange}
            error={Boolean(errors.expirationDate)}
            helperText={
              errors.expirationDate?.message ??
              (prazoPlano != null
                ? `Sugestão: data de autorização + prazo do plano (${prazoPlano} dias). Pode ser alterada.`
                : 'Selecione o plano e a data de autorização para sugerir a validade.')
            }
          />
        )}
      />

      <Typography variant="subtitle2" fontWeight={700}>
        Procedimentos
      </Typography>
      {errors.procedures?.root?.message || errors.procedures?.message ? (
        <Alert severity="error">{errors.procedures.root?.message ?? errors.procedures.message}</Alert>
      ) : null}
      {errorProcedimentos ? <Alert severity="error">{errorProcedimentos}</Alert> : null}
      {healthPlanId == null ? (
        <Alert severity="info">Selecione o plano de saúde para listar procedimentos com preço cadastrado.</Alert>
      ) : null}
      {healthPlanId != null && healthProfessionalId == null ? (
        <Alert severity="info">
          Selecione o profissional para filtrar procedimentos das especialidades atendidas.
        </Alert>
      ) : null}
      {loadingProcedimentos ? (
        <Stack direction="row" alignItems="center" gap={1}>
          <CircularProgress size={16} />
          <Typography variant="body2">Carregando procedimentos do plano...</Typography>
        </Stack>
      ) : null}

      {fields.map((field, index) => {
        const selecionados = (proceduresWatch ?? [])
          .map((item, itemIndex) => (itemIndex === index ? undefined : item?.procedureId))
          .filter((id): id is number => typeof id === 'number')
        const opcoes = procedimentosElegiveis.filter(
          (item) => !selecionados.includes(item.id) || item.id === proceduresWatch?.[index]?.procedureId,
        )
        const itemError = errors.procedures?.[index]

        return (
          <Stack key={field.id} direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="flex-start">
            <Controller
              name={`procedures.${index}.procedureId`}
              control={control}
              render={({ field: procedureField }) => (
                <TextField
                  select
                  label="Procedimento"
                  value={procedureField.value ?? ''}
                  onChange={(event) => {
                    const id = Number(event.target.value)
                    procedureField.onChange(id)
                    if (healthPlanId != null) {
                      const proc = opcoes.find((item) => item.id === id)
                      const valor = valorDoPlano(proc, healthPlanId)
                      if (valor != null) setValue(`procedures.${index}.value`, valor)
                    }
                  }}
                  error={Boolean(itemError?.procedureId)}
                  helperText={itemError?.procedureId?.message ?? ' '}
                  sx={{ flex: 1, minWidth: 240 }}
                  disabled={opcoes.length === 0 && procedureField.value == null}
                >
                  <MenuItem value="" disabled>
                    Selecione um procedimento
                  </MenuItem>
                  {opcoes.map((item) => {
                    const tiss = healthPlanId != null ? tissCodeDoPlano(item, healthPlanId) : undefined
                    return (
                      <MenuItem key={item.id} value={item.id}>
                        {tiss ? `${item.name} (${tiss})` : item.name}
                      </MenuItem>
                    )
                  })}
                </TextField>
              )}
            />
            <Controller
              name={`procedures.${index}.authorizedQuantity`}
              control={control}
              render={({ field: qtyField }) => (
                <TextField
                  label="Qtd. autorizada"
                  type="number"
                  inputProps={{ min: 1, step: 1 }}
                  value={qtyField.value ?? ''}
                  onChange={(event) => qtyField.onChange(Number(event.target.value))}
                  error={Boolean(itemError?.authorizedQuantity)}
                  helperText={itemError?.authorizedQuantity?.message ?? ' '}
                  sx={{ width: { xs: '100%', sm: 140 } }}
                />
              )}
            />
            <Controller
              name={`procedures.${index}.value`}
              control={control}
              render={({ field: valueField }) => (
                <CampoValorMoeda
                  label="Valor"
                  value={valueField.value}
                  onChange={valueField.onChange}
                  onBlur={valueField.onBlur}
                  inputRef={valueField.ref}
                  error={Boolean(itemError?.value)}
                  helperText={itemError?.value?.message ?? ' '}
                />
              )}
            />
            <IconButton
              aria-label="Remover procedimento"
              onClick={() => remove(index)}
              disabled={fields.length === 1}
              sx={{ mt: 0.5 }}
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
          append({
            procedureId: undefined as unknown as number,
            authorizedQuantity: 1,
            value: undefined as unknown as number,
          })
        }
        disabled={procedimentosElegiveis.length === 0 || fields.length >= procedimentosElegiveis.length}
        sx={{ alignSelf: 'flex-start' }}
      >
        Adicionar procedimento
      </Button>

      <Stack direction="row" spacing={1} justifyContent="flex-end">
        {onCancel ? (
          <Button type="button" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
        ) : null}
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? 'Salvando...' : submitLabel}
        </Button>
      </Stack>
    </Stack>
  )
}
