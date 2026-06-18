import { Button, MenuItem, Stack, TextField } from '@mui/material'
import { Controller, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form'
import type { SaidaFormValues } from '../schemas/saida.schema'
import type { LoteEstoque } from '../types/estoque'

interface SaidaFormProps {
  register: UseFormRegister<SaidaFormValues>
  control: Control<SaidaFormValues>
  errors: FieldErrors<SaidaFormValues>
  lotes: LoteEstoque[]
  loading: boolean
  submitLabel: string
}

function formatarLabelLote(lote: LoteEstoque): string {
  const produto = lote.product?.name ?? `produto #${lote.productId}`
  const local = lote.location?.name ?? `local #${lote.locationId}`
  return `Lote #${lote.id} — ${produto} — ${local} (saldo: ${lote.currentQuantity})`
}

export function SaidaForm({
  register,
  control,
  errors,
  lotes,
  loading,
  submitLabel,
}: SaidaFormProps) {
  return (
    <Stack spacing={2} sx={{ maxWidth: 520 }}>
      <Controller
        name="batchId"
        control={control}
        render={({ field }) => (
          <TextField
            select
            label="Lote"
            value={field.value ?? ''}
            onChange={(event) => field.onChange(Number(event.target.value))}
            error={Boolean(errors.batchId)}
            helperText={errors.batchId?.message}
          >
            <MenuItem value="" disabled>
              Selecione um lote
            </MenuItem>
            {lotes.map((lote) => (
              <MenuItem key={lote.id} value={lote.id}>
                {formatarLabelLote(lote)}
              </MenuItem>
            ))}
          </TextField>
        )}
      />
      <TextField
        label="Quantidade"
        type="number"
        inputProps={{ min: 1, step: 1 }}
        error={Boolean(errors.quantity)}
        helperText={errors.quantity?.message}
        {...register('quantity', { valueAsNumber: true })}
      />
      <TextField
        label="Data da saida"
        type="date"
        InputLabelProps={{ shrink: true }}
        error={Boolean(errors.exitDate)}
        helperText={errors.exitDate?.message}
        {...register('exitDate')}
      />
      <Button type="submit" variant="contained" disabled={loading}>
        {submitLabel}
      </Button>
    </Stack>
  )
}
