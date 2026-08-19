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
import type { HealthProfessional } from '../types/profissional'
import { mensagemErroApi } from '../utils/apiError'
import { adicionarDiasISO } from '../utils/dataISO'

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
    formState: { errors },
  } = useForm<GuiaFormInput, unknown, GuiaFormValues>({
    resolver: zodResolver(guiaSchema),
    defaultValues,
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'procedures' })
  const healthPlanId = useWatch({ control, name: 'healthPlanId' })
  const startDate = useWatch({ control, name: 'startDate' })
  const healthProfessionalId = useWatch({ control, name: 'healthProfessionalId' })
  const proceduresWatch = useWatch({ control, name: 'procedures' })

  const [procedimentosPlano, setProcedimentosPlano] = useState<Procedure[]>([])
  const [loadingProcedimentos, setLoadingProcedimentos] = useState(false)
  const [errorProcedimentos, setErrorProcedimentos] = useState<string | null>(null)

  const profissionaisAtivos = useMemo(
    () => profissionais.filter((item) => item.isActive || item.id === healthProfessionalId),
    [profissionais, healthProfessionalId],
  )

  const especialidadeIdsDoProfissional = useMemo(() => {
    const profissional = profissionaisAtivos.find((item) => item.id === healthProfessionalId)
    return new Set((profissional?.specialties ?? []).map((item) => item.specialtyId))
  }, [profissionaisAtivos, healthProfessionalId])

  const procedimentosElegiveis = useMemo(() => {
    if (especialidadeIdsDoProfissional.size === 0) return []
    return procedimentosPlano.filter((item) => especialidadeIdsDoProfissional.has(item.specialtyId))
  }, [procedimentosPlano, especialidadeIdsDoProfissional])

  const prazoPlano = planos.find((item) => item.id === healthPlanId)?.submissionDeadlineDays

  useEffect(() => {
    if (!startDate || healthPlanId == null) return
    const plano = planos.find((item) => item.id === healthPlanId)
    if (!plano) return
    setValue('expirationDate', adicionarDiasISO(startDate, plano.submissionDeadlineDays))
  }, [startDate, healthPlanId, planos, setValue])

  useEffect(() => {
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
  }, [healthPlanId])

  return (
    <Stack component="form" spacing={2} onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="patientId"
        control={control}
        render={({ field: { onChange, value, ref, onBlur } }) => (
          <Autocomplete
            options={pacientes}
            getOptionLabel={(paciente) => paciente.name}
            isOptionEqualToValue={(option, selected) => option.id === selected.id}
            value={pacientes.find((paciente) => paciente.id === value) ?? null}
            onChange={(_, paciente) => onChange(paciente?.id)}
            onBlur={onBlur}
            disabled={patientLocked}
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
          <Autocomplete
            options={profissionaisAtivos}
            getOptionLabel={(profissional) => profissional.name}
            isOptionEqualToValue={(option, selected) => option.id === selected.id}
            value={profissionaisAtivos.find((profissional) => profissional.id === value) ?? null}
            onChange={(_, profissional) => onChange(profissional?.id)}
            onBlur={onBlur}
            disabled={professionalLocked}
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
        name="startDate"
        control={control}
        render={({ field }) => (
          <TextField
            label="Data de início"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={field.value}
            onChange={field.onChange}
            error={Boolean(errors.startDate)}
            helperText={errors.startDate?.message ?? ' '}
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
            InputProps={{ readOnly: true }}
            value={field.value}
            error={Boolean(errors.expirationDate)}
            helperText={
              errors.expirationDate?.message ??
              (prazoPlano != null
                ? `Calculada com base na data de início + prazo do plano (${prazoPlano} dias).`
                : 'Selecione o plano e a data de início para calcular a validade.')
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
                  onChange={(event) => procedureField.onChange(Number(event.target.value))}
                  error={Boolean(itemError?.procedureId)}
                  helperText={itemError?.procedureId?.message ?? ' '}
                  sx={{ flex: 1, minWidth: 240 }}
                  disabled={opcoes.length === 0 && procedureField.value == null}
                >
                  <MenuItem value="" disabled>
                    Selecione um procedimento
                  </MenuItem>
                  {opcoes.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.name} ({item.tissCode})
                    </MenuItem>
                  ))}
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
                  sx={{ width: { xs: '100%', sm: 160 } }}
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
        onClick={() => append({ procedureId: undefined as unknown as number, authorizedQuantity: 1 })}
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
