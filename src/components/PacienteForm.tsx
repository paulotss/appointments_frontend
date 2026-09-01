import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { Button, IconButton, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { Controller, useFieldArray, useForm, useWatch, type DefaultValues } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  pacienteSchema,
  type PacienteFormInput,
  type PacienteFormValues,
} from '../schemas/paciente.schema'
import type { HealthPlan } from '../types/planoSaude'

interface PacienteFormProps {
  defaultValues: DefaultValues<PacienteFormInput>
  planos: HealthPlan[]
  loading: boolean
  submitLabel: string
  onSubmit: (values: PacienteFormValues) => void
  onCancel?: () => void
}

export function PacienteForm({
  defaultValues,
  planos,
  loading,
  submitLabel,
  onSubmit,
  onCancel,
}: PacienteFormProps) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PacienteFormInput, unknown, PacienteFormValues>({
    resolver: zodResolver(pacienteSchema),
    defaultValues,
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'insuranceCards',
  })

  const cardsWatch = useWatch({ control, name: 'insuranceCards' })

  return (
    <Stack component="form" spacing={2} onSubmit={handleSubmit(onSubmit)}>
      <TextField
        label="Nome"
        error={Boolean(errors.name)}
        helperText={errors.name?.message}
        {...register('name')}
      />
      <TextField
        label="Telefone"
        error={Boolean(errors.phone)}
        helperText={errors.phone?.message}
        {...register('phone')}
      />
      <TextField
        label="E-mail (opcional)"
        type="email"
        error={Boolean(errors.email)}
        helperText={errors.email?.message}
        {...register('email')}
      />
      <TextField
        label="Data de nascimento (opcional)"
        type="date"
        InputLabelProps={{ shrink: true }}
        error={Boolean(errors.birthDate)}
        helperText={errors.birthDate?.message}
        {...register('birthDate')}
      />
      <TextField
        label="CPF (opcional)"
        error={Boolean(errors.cpf)}
        helperText={errors.cpf?.message}
        {...register('cpf')}
      />

      <Typography variant="subtitle2" fontWeight={700}>
        Carteirinhas de plano
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Necessárias para o XML TISS. Uma carteirinha por plano.
      </Typography>
      {errors.insuranceCards?.root?.message || errors.insuranceCards?.message ? (
        <Typography color="error" variant="body2">
          {errors.insuranceCards.root?.message ?? errors.insuranceCards.message}
        </Typography>
      ) : null}
      {planos.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Cadastre um plano de saúde para informar carteirinhas.
        </Typography>
      ) : null}

      {fields.map((field, index) => {
        const selecionados = (cardsWatch ?? [])
          .map((item, itemIndex) => (itemIndex === index ? undefined : item?.healthPlanId))
          .filter((id): id is number => typeof id === 'number')
        const opcoes = planos.filter(
          (plano) => !selecionados.includes(plano.id) || plano.id === cardsWatch?.[index]?.healthPlanId,
        )
        const itemError = errors.insuranceCards?.[index]

        return (
          <Stack key={field.id} direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="flex-start">
            <input
              type="hidden"
              defaultValue={
                typeof (field as { cardId?: number }).cardId === 'number'
                  ? String((field as { cardId?: number }).cardId)
                  : ''
              }
              {...register(`insuranceCards.${index}.cardId`, {
                setValueAs: (value) =>
                  value === '' || value == null || Number.isNaN(Number(value))
                    ? undefined
                    : Number(value),
              })}
            />
            <Controller
              name={`insuranceCards.${index}.healthPlanId`}
              control={control}
              render={({ field: planField }) => (
                <TextField
                  select
                  label="Plano de saúde"
                  value={planField.value ?? ''}
                  onChange={(event) => planField.onChange(Number(event.target.value))}
                  error={Boolean(itemError?.healthPlanId)}
                  helperText={itemError?.healthPlanId?.message ?? ' '}
                  sx={{ flex: 1, minWidth: 200 }}
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
            <TextField
              label="Número da carteirinha"
              error={Boolean(itemError?.cardNumber)}
              helperText={itemError?.cardNumber?.message ?? ' '}
              sx={{ flex: 1, minWidth: 180 }}
              {...register(`insuranceCards.${index}.cardNumber`)}
            />
            <TextField
              label="Validade"
              type="date"
              InputLabelProps={{ shrink: true }}
              error={Boolean(itemError?.expirationDate)}
              helperText={itemError?.expirationDate?.message ?? ' '}
              sx={{ width: { xs: '100%', sm: 180 } }}
              {...register(`insuranceCards.${index}.expirationDate`)}
            />
            <IconButton aria-label="Remover carteirinha" onClick={() => remove(index)} sx={{ mt: 0.5 }}>
              <DeleteOutlineIcon />
            </IconButton>
          </Stack>
        )
      })}

      <Button
        type="button"
        startIcon={<AddIcon />}
        onClick={() =>
          append({
            healthPlanId: undefined as unknown as number,
            cardNumber: '',
            expirationDate: '',
          })
        }
        disabled={planos.length === 0 || fields.length >= planos.length}
        sx={{ alignSelf: 'flex-start' }}
      >
        Adicionar carteirinha
      </Button>

      <Stack direction="row" spacing={1.5}>
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
