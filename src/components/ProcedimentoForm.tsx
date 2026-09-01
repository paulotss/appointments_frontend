import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { Button, IconButton, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { Controller, useFieldArray, useForm, useWatch, type DefaultValues } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CampoValorMoeda } from './CampoValorMoeda'
import {
  procedimentoSchema,
  type ProcedimentoFormInput,
  type ProcedimentoFormValues,
} from '../schemas/procedimento.schema'
import type { HealthPlan } from '../types/planoSaude'
import { TISS_GUIDE_TYPE_LABELS, TISS_GUIDE_TYPES, sugerirTipoGuiaTiss } from '../types/tiss'
import type { Especialidade } from '../types/registro'

interface ProcedimentoFormProps {
  defaultValues: DefaultValues<ProcedimentoFormInput>
  especialidades: Especialidade[]
  planos: HealthPlan[]
  loading: boolean
  submitLabel: string
  onSubmit: (values: ProcedimentoFormValues) => void
}

export function ProcedimentoForm({
  defaultValues,
  especialidades,
  planos,
  loading,
  submitLabel,
  onSubmit,
}: ProcedimentoFormProps) {
  const {
    control,
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<ProcedimentoFormInput, unknown, ProcedimentoFormValues>({
    resolver: zodResolver(procedimentoSchema),
    defaultValues,
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'healthPlanPrices',
  })

  const pricesWatch = useWatch({ control, name: 'healthPlanPrices' })

  return (
    <Stack component="form" spacing={2} onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="specialtyId"
        control={control}
        render={({ field }) => (
          <TextField
            select
            label="Especialidade"
            value={field.value ?? ''}
            onChange={(event) => field.onChange(Number(event.target.value))}
            error={Boolean(errors.specialtyId)}
            helperText={errors.specialtyId?.message ?? ' '}
          >
            <MenuItem value="" disabled>
              Selecione uma especialidade
            </MenuItem>
            {especialidades.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {item.nome}
              </MenuItem>
            ))}
          </TextField>
        )}
      />
      <TextField
        label="Nome"
        error={Boolean(errors.name)}
        helperText={errors.name?.message ?? 'O backend grava o nome em maiúsculas.'}
        {...register('name')}
      />
      <Controller
        name="tissGuideType"
        control={control}
        render={({ field }) => (
          <TextField
            select
            label="Tipo da guia TISS"
            value={field.value ?? ''}
            onChange={field.onChange}
            error={Boolean(errors.tissGuideType)}
            helperText={
              errors.tissGuideType?.message ??
              'Consulta gera guiaConsulta; exames e procedimentos geram SP/SADT. Códigos TUSS 1010… costumam ser consulta.'
            }
          >
            {TISS_GUIDE_TYPES.map((tipo) => (
              <MenuItem key={tipo} value={tipo}>
                {TISS_GUIDE_TYPE_LABELS[tipo]}
              </MenuItem>
            ))}
          </TextField>
        )}
      />
      <Controller
        name="value"
        control={control}
        render={({ field }) => (
          <CampoValorMoeda
            label="Valor particular"
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            inputRef={field.ref}
            error={Boolean(errors.value)}
            helperText={errors.value?.message ?? ' '}
          />
        )}
      />

      <Typography variant="subtitle2" fontWeight={700}>
        Valores por plano de saúde
      </Typography>
      {errors.healthPlanPrices?.root?.message || errors.healthPlanPrices?.message ? (
        <Typography color="error" variant="body2">
          {errors.healthPlanPrices.root?.message ?? errors.healthPlanPrices.message}
        </Typography>
      ) : null}

      {fields.map((field, index) => {
        const selecionados = (pricesWatch ?? [])
          .map((item, itemIndex) => (itemIndex === index ? undefined : item?.healthPlanId))
          .filter((id): id is number => typeof id === 'number')
        const opcoes = planos.filter(
          (plano) => !selecionados.includes(plano.id) || plano.id === pricesWatch?.[index]?.healthPlanId,
        )
        const itemError = errors.healthPlanPrices?.[index]

        return (
          <Stack key={field.id} direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="flex-start">
            <Controller
              name={`healthPlanPrices.${index}.healthPlanId`}
              control={control}
              render={({ field: planField }) => (
                <TextField
                  select
                  label="Plano de saúde"
                  value={planField.value ?? ''}
                  onChange={(event) => planField.onChange(Number(event.target.value))}
                  error={Boolean(itemError?.healthPlanId)}
                  helperText={itemError?.healthPlanId?.message ?? ' '}
                  sx={{ flex: 1, minWidth: 220 }}
                >
                  <MenuItem value="" disabled>
                    Selecione um plano
                  </MenuItem>
                  {opcoes.map((plano) => (
                    <MenuItem key={plano.id} value={plano.id}>
                      {plano.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <Controller
              name={`healthPlanPrices.${index}.tissCode`}
              control={control}
              render={({ field: tissField }) => (
                <TextField
                  label="Código TISS"
                  value={tissField.value ?? ''}
                  onChange={(event) => {
                    tissField.onChange(event)
                    const codes = (getValues('healthPlanPrices') ?? []).map((item, itemIndex) =>
                      itemIndex === index ? event.target.value : String(item?.tissCode ?? ''),
                    )
                    setValue('tissGuideType', sugerirTipoGuiaTiss(codes))
                  }}
                  onBlur={tissField.onBlur}
                  inputRef={tissField.ref}
                  error={Boolean(itemError?.tissCode)}
                  helperText={itemError?.tissCode?.message ?? ' '}
                  sx={{ width: { xs: '100%', sm: 160 } }}
                />
              )}
            />
            <Controller
              name={`healthPlanPrices.${index}.value`}
              control={control}
              render={({ field: valueField }) => (
                <CampoValorMoeda
                  label="Valor do convênio"
                  value={valueField.value}
                  onChange={valueField.onChange}
                  onBlur={valueField.onBlur}
                  inputRef={valueField.ref}
                  error={Boolean(itemError?.value)}
                  helperText={itemError?.value?.message ?? ' '}
                />
              )}
            />
            <IconButton aria-label="Remover preço do plano" onClick={() => remove(index)} sx={{ mt: 0.5 }}>
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
            healthPlanId: undefined as unknown as number,
            tissCode: '',
            value: undefined as unknown as number,
          })
        }
        disabled={fields.length >= planos.length}
        sx={{ alignSelf: 'flex-start' }}
      >
        Adicionar valor de plano
      </Button>

      <Button type="submit" variant="contained" disabled={loading}>
        {loading ? 'Salvando...' : submitLabel}
      </Button>
    </Stack>
  )
}
