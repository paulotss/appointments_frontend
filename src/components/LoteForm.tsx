import {
  Button,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material'
import { Controller, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form'
import type { LoteFormValues } from '../schemas/lote.schema'
import type { LocalArmazenamento, ProdutoConfig, Setor } from '../types/estoque'
import type { SystemUser } from '../types/user'

interface LoteFormProps {
  register: UseFormRegister<LoteFormValues>
  control: Control<LoteFormValues>
  errors: FieldErrors<LoteFormValues>
  produtos: ProdutoConfig[]
  setores: Setor[]
  locais: LocalArmazenamento[]
  usuarios?: SystemUser[]
  exibirUsuario?: boolean
  exibirQuantidadeAtual?: boolean
  loading: boolean
  submitLabel: string
}

export function LoteForm({
  register,
  control,
  errors,
  produtos,
  setores,
  locais,
  usuarios = [],
  exibirUsuario = true,
  exibirQuantidadeAtual = true,
  loading,
  submitLabel,
}: LoteFormProps) {
  return (
    <Stack spacing={2} sx={{ maxWidth: 520 }}>
      <Controller
        name="productId"
        control={control}
        render={({ field }) => (
          <TextField
            select
            label="Produto"
            value={field.value ?? ''}
            onChange={(event) => field.onChange(Number(event.target.value))}
            error={Boolean(errors.productId)}
            helperText={errors.productId?.message}
          >
            <MenuItem value="" disabled>
              Selecione um produto
            </MenuItem>
            {produtos.map((produto) => (
              <MenuItem key={produto.id} value={produto.id}>
                {produto.nome}
              </MenuItem>
            ))}
          </TextField>
        )}
      />
      <Controller
        name="sectorId"
        control={control}
        render={({ field }) => (
          <TextField
            select
            label="Setor"
            value={field.value ?? ''}
            onChange={(event) => field.onChange(Number(event.target.value))}
            error={Boolean(errors.sectorId)}
            helperText={errors.sectorId?.message}
          >
            <MenuItem value="" disabled>
              Selecione um setor
            </MenuItem>
            {setores.map((setor) => (
              <MenuItem key={setor.id} value={setor.id}>
                {setor.nome}
              </MenuItem>
            ))}
          </TextField>
        )}
      />
      <Controller
        name="locationId"
        control={control}
        render={({ field }) => (
          <TextField
            select
            label="Local"
            value={field.value ?? ''}
            onChange={(event) => field.onChange(Number(event.target.value))}
            error={Boolean(errors.locationId)}
            helperText={errors.locationId?.message}
          >
            <MenuItem value="" disabled>
              Selecione um local
            </MenuItem>
            {locais.map((local) => (
              <MenuItem key={local.id} value={local.id}>
                {local.nome}
              </MenuItem>
            ))}
          </TextField>
        )}
      />
      {exibirUsuario ? (
        <Controller
          name="userId"
          control={control}
          render={({ field }) => (
            <TextField
              select
              label="Usuario"
              value={field.value ?? ''}
              onChange={(event) => field.onChange(Number(event.target.value))}
              error={Boolean(errors.userId)}
              helperText={errors.userId?.message}
            >
              <MenuItem value="" disabled>
                Selecione um usuario
              </MenuItem>
              {usuarios.map((usuario) => (
                <MenuItem key={usuario.id} value={usuario.id}>
                  {usuario.name}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
      ) : null}
      <TextField
        label={exibirQuantidadeAtual ? 'Qtd. inicial' : 'Quantidade'}
        type="number"
        inputProps={{ min: 1, step: 1 }}
        error={Boolean(errors.initialQuantity)}
        helperText={errors.initialQuantity?.message}
        {...register('initialQuantity', { valueAsNumber: true })}
      />
      {exibirQuantidadeAtual ? (
        <TextField
          label="Qtd. atual"
          type="number"
          inputProps={{ min: 1, step: 1 }}
          error={Boolean(errors.currentQuantity)}
          helperText={errors.currentQuantity?.message ?? 'Opcional. Se vazio, usa a quantidade inicial.'}
          {...register('currentQuantity', { valueAsNumber: true })}
        />
      ) : null}
      <TextField
        label="Valor"
        type="number"
        inputProps={{ min: 0, step: 0.01 }}
        error={Boolean(errors.value)}
        helperText={errors.value?.message}
        {...register('value', { valueAsNumber: true })}
      />
      <TextField
        label="Inclusao"
        type="date"
        InputLabelProps={{ shrink: true }}
        error={Boolean(errors.movementDate)}
        helperText={errors.movementDate?.message}
        {...register('movementDate')}
      />
      <TextField
        label="Validade"
        type="date"
        InputLabelProps={{ shrink: true }}
        error={Boolean(errors.expirationDate)}
        helperText={errors.expirationDate?.message}
        {...register('expirationDate')}
      />
      <TextField
        label="Chave NF-e"
        error={Boolean(errors.invoiceAccessKey)}
        helperText={errors.invoiceAccessKey?.message}
        {...register('invoiceAccessKey')}
      />
      <TextField
        label="Observacoes"
        multiline
        minRows={2}
        error={Boolean(errors.notes)}
        helperText={errors.notes?.message}
        {...register('notes')}
      />
      <Button type="submit" variant="contained" disabled={loading}>
        {loading ? 'Salvando...' : submitLabel}
      </Button>
    </Stack>
  )
}
