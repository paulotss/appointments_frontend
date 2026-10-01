import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import {
  Autocomplete,
  Button,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { Controller, useFieldArray, useForm, useWatch, type DefaultValues } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  pacoteSchema,
  type PacoteFormInput,
  type PacoteFormValues,
} from '../schemas/pacote.schema'
import type { Procedure } from '../types/procedimento'
import { aplicarDescontoPercentual } from '../types/pacote'
import { formatarMoedaBRL, parseValorDecimal } from '../utils/moedaBRL'

interface PacoteFormProps {
  defaultValues: DefaultValues<PacoteFormInput>
  procedimentos: Procedure[]
  loading: boolean
  submitLabel: string
  onSubmit: (values: PacoteFormValues) => void
  onCancel?: () => void
}

export function PacoteForm({
  defaultValues,
  procedimentos,
  loading,
  submitLabel,
  onSubmit,
  onCancel,
}: PacoteFormProps) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PacoteFormInput, unknown, PacoteFormValues>({
    resolver: zodResolver(pacoteSchema),
    defaultValues,
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  const discountPercent = useWatch({ control, name: 'discountPercent' }) ?? 0
  const itemsWatch = useWatch({ control, name: 'items' }) ?? []

  const linhas = fields.map((field, index) => {
    const procedureId = itemsWatch[index]?.procedureId
    const quantity = itemsWatch[index]?.quantity ?? 0
    const procedimento = procedimentos.find((item) => item.id === procedureId)
    const catalogo = procedimento ? parseValorDecimal(procedimento.value) || 0 : 0
    const comDesconto = aplicarDescontoPercentual(catalogo, discountPercent)
    return {
      key: field.id,
      nome: procedimento?.name ?? '—',
      catalogo,
      comDesconto,
      quantity,
      subtotal: comDesconto * (Number.isFinite(quantity) ? quantity : 0),
    }
  })
  const total = linhas.reduce((sum, linha) => sum + linha.subtotal, 0)

  return (
    <Stack component="form" spacing={2} onSubmit={handleSubmit(onSubmit)}>
      <TextField
        label="Nome"
        error={Boolean(errors.name)}
        helperText={errors.name?.message ?? 'O backend grava o nome em maiúsculas.'}
        {...register('name')}
      />
      <TextField
        label="Desconto (%)"
        type="number"
        inputProps={{ min: 0, max: 100, step: 0.01 }}
        error={Boolean(errors.discountPercent)}
        helperText={
          errors.discountPercent?.message ??
          'Aplicado ao valor particular de cada procedimento, não ao total.'
        }
        {...register('discountPercent', { valueAsNumber: true })}
      />
      <Controller
        name="isActive"
        control={control}
        render={({ field }) => (
          <TextField
            select
            label="Status"
            value={field.value ? 'true' : 'false'}
            onChange={(event) => field.onChange(event.target.value === 'true')}
          >
            <MenuItem value="true">Ativo</MenuItem>
            <MenuItem value="false">Inativo</MenuItem>
          </TextField>
        )}
      />

      <Stack spacing={1}>
        <Typography variant="subtitle2">Procedimentos</Typography>
        {errors.items?.message ? (
          <Typography variant="caption" color="error">
            {errors.items.message}
          </Typography>
        ) : null}
        {fields.map((field, index) => (
          <Stack key={field.id} direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="flex-start">
            <Controller
              name={`items.${index}.procedureId`}
              control={control}
              render={({ field: itemField }) => (
                <Autocomplete
                  options={procedimentos}
                  getOptionLabel={(item) =>
                    `${item.name} — ${formatarMoedaBRL(item.value) || 's/ valor'}`
                  }
                  isOptionEqualToValue={(option, selected) => option.id === selected.id}
                  value={procedimentos.find((item) => item.id === itemField.value) ?? null}
                  onChange={(_, selected) => itemField.onChange(selected?.id)}
                  sx={{ flex: 1, minWidth: 220 }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Procedimento"
                      error={Boolean(errors.items?.[index]?.procedureId)}
                      helperText={errors.items?.[index]?.procedureId?.message ?? ' '}
                    />
                  )}
                />
              )}
            />
            <TextField
              label="Qtd"
              type="number"
              inputProps={{ min: 1, step: 1 }}
              sx={{ width: { xs: '100%', sm: 100 } }}
              error={Boolean(errors.items?.[index]?.quantity)}
              helperText={errors.items?.[index]?.quantity?.message ?? ' '}
              {...register(`items.${index}.quantity`, { valueAsNumber: true })}
            />
            <IconButton
              aria-label="Remover procedimento"
              onClick={() => remove(index)}
              disabled={fields.length <= 1}
              sx={{ mt: 0.5 }}
            >
              <DeleteOutlineIcon />
            </IconButton>
          </Stack>
        ))}
        <Button
          type="button"
          startIcon={<AddIcon />}
          onClick={() => append({ procedureId: undefined as unknown as number, quantity: 1 })}
        >
          Acrescentar procedimento
        </Button>
      </Stack>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Procedimento</TableCell>
            <TableCell align="right">Valor</TableCell>
            <TableCell align="right">Com desconto</TableCell>
            <TableCell align="right">Qtd</TableCell>
            <TableCell align="right">Subtotal</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {linhas.map((linha) => (
            <TableRow key={linha.key}>
              <TableCell>{linha.nome}</TableCell>
              <TableCell align="right">{formatarMoedaBRL(linha.catalogo) || '—'}</TableCell>
              <TableCell align="right">{formatarMoedaBRL(linha.comDesconto) || '—'}</TableCell>
              <TableCell align="right">{linha.quantity || '—'}</TableCell>
              <TableCell align="right">{formatarMoedaBRL(linha.subtotal) || '—'}</TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell colSpan={4}>
              <strong>Total do pacote</strong>
            </TableCell>
            <TableCell align="right">
              <strong>{formatarMoedaBRL(total) || '—'}</strong>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

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
