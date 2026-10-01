import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import {
  Autocomplete,
  Button,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { Controller, useFieldArray, useForm, useWatch, type DefaultValues } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CampoValorMoeda } from './CampoValorMoeda'
import {
  planoCartaoSchema,
  type PlanoCartaoFormInput,
  type PlanoCartaoFormValues,
} from '../schemas/cartao.schema'
import { BENEFIT_KINDS, BENEFIT_KIND_LABELS } from '../types/cartao'
import type { Procedure } from '../types/procedimento'

interface PlanoCartaoFormProps {
  defaultValues: DefaultValues<PlanoCartaoFormInput>
  procedimentos: Procedure[]
  loading: boolean
  submitLabel: string
  onSubmit: (values: PlanoCartaoFormValues) => void
  onCancel?: () => void
}

export function PlanoCartaoForm({
  defaultValues,
  procedimentos,
  loading,
  submitLabel,
  onSubmit,
  onCancel,
}: PlanoCartaoFormProps) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PlanoCartaoFormInput, unknown, PlanoCartaoFormValues>({
    resolver: zodResolver(planoCartaoSchema),
    defaultValues,
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'benefits' })
  const benefitsWatch = useWatch({ control, name: 'benefits' }) ?? []

  return (
    <Stack component="form" spacing={2} onSubmit={handleSubmit(onSubmit)}>
      <TextField
        label="Nome"
        error={Boolean(errors.name)}
        helperText={errors.name?.message ?? 'O backend grava o nome em maiúsculas.'}
        {...register('name')}
      />
      <Controller
        name="annualPrice"
        control={control}
        render={({ field }) => (
          <CampoValorMoeda
            label="Preço anual"
            value={typeof field.value === 'number' ? field.value : undefined}
            onChange={(value) => field.onChange(value ?? 0)}
            onBlur={field.onBlur}
            inputRef={field.ref}
            error={Boolean(errors.annualPrice)}
            helperText={errors.annualPrice?.message ?? 'Valor da anuidade, dividido nas parcelas.'}
          />
        )}
      />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Controller
          name="adhesionFee"
          control={control}
          render={({ field }) => (
            <CampoValorMoeda
              label="Taxa de adesão"
              value={typeof field.value === 'number' ? field.value : undefined}
              onChange={(value) => field.onChange(value ?? 0)}
              onBlur={field.onBlur}
              inputRef={field.ref}
              error={Boolean(errors.adhesionFee)}
              helperText={errors.adhesionFee?.message ?? 'Somada à primeira parcela.'}
              fullWidth
            />
          )}
        />
        <Controller
          name="dependentFee"
          control={control}
          render={({ field }) => (
            <CampoValorMoeda
              label="Taxa por dependente"
              value={typeof field.value === 'number' ? field.value : undefined}
              onChange={(value) => field.onChange(value ?? 0)}
              onBlur={field.onBlur}
              inputRef={field.ref}
              error={Boolean(errors.dependentFee)}
              helperText={errors.dependentFee?.message ?? 'Somada à primeira parcela.'}
              fullWidth
            />
          )}
        />
      </Stack>
      <Controller
        name="isActive"
        control={control}
        render={({ field }) => (
          <FormControlLabel
            control={<Switch checked={Boolean(field.value)} onChange={(_, checked) => field.onChange(checked)} />}
            label="Plano ativo"
          />
        )}
      />

      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle1" fontWeight={700}>
          Benefícios
        </Typography>
        <Button
          type="button"
          size="small"
          startIcon={<AddIcon />}
          onClick={() =>
            append({
              title: '',
              description: '',
              kind: 'quota',
              quantity: 1,
              discountPercent: 20,
              procedureIds: [],
            })
          }
        >
          Adicionar
        </Button>
      </Stack>
      {typeof errors.benefits?.message === 'string' ? (
        <Typography variant="body2" color="error">
          {errors.benefits.message}
        </Typography>
      ) : null}

      {fields.map((field, index) => {
        const kind = benefitsWatch[index]?.kind ?? 'quota'
        const benefitErrors = errors.benefits?.[index]
        return (
          <Stack key={field.id} spacing={1.5} sx={{ border: 1, borderColor: 'divider', p: 2, borderRadius: 1 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2">Benefício {index + 1}</Typography>
              <IconButton
                aria-label="Remover benefício"
                disabled={fields.length === 1}
                onClick={() => remove(index)}
              >
                <DeleteOutlineIcon />
              </IconButton>
            </Stack>
            <TextField
              label="Título"
              error={Boolean(benefitErrors?.title)}
              helperText={benefitErrors?.title?.message}
              {...register(`benefits.${index}.title`)}
            />
            <TextField label="Descrição" {...register(`benefits.${index}.description`)} />
            <TextField select label="Tipo" defaultValue={kind} {...register(`benefits.${index}.kind`)}>
              {BENEFIT_KINDS.map((item) => (
                <MenuItem key={item} value={item}>
                  {BENEFIT_KIND_LABELS[item]}
                </MenuItem>
              ))}
            </TextField>
            {kind === 'quota' ? (
              <>
                <TextField
                  label="Quantidade"
                  type="number"
                  inputProps={{ min: 1, step: 1 }}
                  error={Boolean(benefitErrors?.quantity)}
                  helperText={benefitErrors?.quantity?.message ?? 'Sessões incluídas na adesão.'}
                  {...register(`benefits.${index}.quantity`, { valueAsNumber: true })}
                />
                <Controller
                  name={`benefits.${index}.procedureIds`}
                  control={control}
                  render={({ field: procField }) => (
                    <Autocomplete
                      multiple
                      options={procedimentos}
                      getOptionLabel={(item) => item.name}
                      isOptionEqualToValue={(option, selected) => option.id === selected.id}
                      value={procedimentos.filter((item) => (procField.value ?? []).includes(item.id))}
                      onChange={(_, selected) => procField.onChange(selected.map((item) => item.id))}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Procedimentos cobertos"
                          error={Boolean(benefitErrors?.procedureIds)}
                          helperText={
                            benefitErrors?.procedureIds?.message ??
                            'A cota é compartilhada entre estes procedimentos.'
                          }
                        />
                      )}
                    />
                  )}
                />
              </>
            ) : (
              <TextField
                label="Desconto (%)"
                type="number"
                inputProps={{ min: 0, max: 100, step: 0.01 }}
                error={Boolean(benefitErrors?.discountPercent)}
                helperText={
                  benefitErrors?.discountPercent?.message ??
                  'Aplicado aos procedimentos particulares na hora do pagamento.'
                }
                {...register(`benefits.${index}.discountPercent`, { valueAsNumber: true })}
              />
            )}
          </Stack>
        )
      })}

      <Stack direction="row" spacing={1}>
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? 'Salvando...' : submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
        ) : null}
      </Stack>
    </Stack>
  )
}
