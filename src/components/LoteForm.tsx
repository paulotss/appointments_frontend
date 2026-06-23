import {
  Autocomplete,
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
  exibirQuantidadeInicial?: boolean
  exibirQuantidadeAtual?: boolean
  exibirInclusao?: boolean
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
  exibirQuantidadeInicial = true,
  exibirQuantidadeAtual = true,
  exibirInclusao = true,
  loading,
  submitLabel,
}: LoteFormProps) {
  return (
    <Stack spacing={2} sx={{ maxWidth: 520 }}>
      <Controller
        name="productId"
        control={control}
        render={({ field: { onChange, value, ref, onBlur } }) => (
          <Autocomplete
            options={produtos}
            getOptionLabel={(produto) => produto.nome}
            isOptionEqualToValue={(option, selected) => option.id === selected.id}
            value={produtos.find((produto) => produto.id === value) ?? null}
            onChange={(_, produto) => onChange(produto?.id)}
            onBlur={onBlur}
            renderInput={(params) => (
              <TextField
                {...params}
                inputRef={ref}
                label="Produto"
                placeholder="Selecione um produto"
                error={Boolean(errors.productId)}
                helperText={errors.productId?.message}
              />
            )}
          />
        )}
      />
      <Controller
        name="sectorId"
        control={control}
        render={({ field: { onChange, value, ref, onBlur } }) => (
          <Autocomplete
            options={setores}
            getOptionLabel={(setor) => setor.nome}
            isOptionEqualToValue={(option, selected) => option.id === selected.id}
            value={setores.find((setor) => setor.id === value) ?? null}
            onChange={(_, setor) => onChange(setor?.id)}
            onBlur={onBlur}
            renderInput={(params) => (
              <TextField
                {...params}
                inputRef={ref}
                label="Setor"
                placeholder="Selecione um setor"
                error={Boolean(errors.sectorId)}
                helperText={errors.sectorId?.message}
              />
            )}
          />
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
      {exibirQuantidadeInicial ? (
        <TextField
          label={exibirQuantidadeAtual ? 'Qtd. inicial' : 'Quantidade'}
          type="number"
          inputProps={{ min: 1, step: 1 }}
          error={Boolean(errors.initialQuantity)}
          helperText={errors.initialQuantity?.message}
          {...register('initialQuantity', { valueAsNumber: true })}
        />
      ) : null}
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
      {exibirInclusao ? (
        <TextField
          label="Inclusao"
          type="date"
          InputLabelProps={{ shrink: true }}
          error={Boolean(errors.movementDate)}
          helperText={errors.movementDate?.message}
          {...register('movementDate')}
        />
      ) : null}
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
