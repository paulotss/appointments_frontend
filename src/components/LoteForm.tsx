import {
  Autocomplete,
  Button,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material'
import { useEffect, useState } from 'react'
import {
  Controller,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
} from 'react-hook-form'
import type { LoteFormValues } from '../schemas/lote.schema'
import type { LocalArmazenamento, ProdutoConfig, Setor, StockUnit } from '../types/estoque'
import type { SystemUser } from '../types/user'
import {
  digitosParaNumeroMoedaBRL,
  formatarMoedaBRL,
  normalizarDigitosMoedaBRL,
  numeroParaDigitosMoedaBRL,
} from '../utils/moedaBRL'
import { labelUnidadePlural, podeUsarCaixa } from '../utils/stockUnit'

interface CampoValorMoedaProps {
  value: number | undefined
  onChange: (value: number | undefined) => void
  onBlur: () => void
  inputRef: React.Ref<HTMLInputElement>
  error: boolean
  helperText?: string
  label: string
}

function CampoValorMoeda({
  value,
  onChange,
  onBlur,
  inputRef,
  error,
  helperText,
  label,
}: CampoValorMoedaProps) {
  const [digitos, setDigitos] = useState(() => numeroParaDigitosMoedaBRL(value))

  useEffect(() => {
    setDigitos(numeroParaDigitosMoedaBRL(value))
  }, [value])

  return (
    <TextField
      label={label}
      value={digitos === '' ? '' : formatarMoedaBRL(digitosParaNumeroMoedaBRL(digitos))}
      onChange={(event) => {
        const novosDigitos = normalizarDigitosMoedaBRL(digitos, event.target.value)
        setDigitos(novosDigitos)
        onChange(digitosParaNumeroMoedaBRL(novosDigitos))
      }}
      onBlur={onBlur}
      inputRef={inputRef}
      inputProps={{ inputMode: 'numeric' }}
      error={error}
      helperText={helperText}
    />
  )
}

interface LoteFormProps {
  register: UseFormRegister<LoteFormValues>
  control: Control<LoteFormValues>
  errors: FieldErrors<LoteFormValues>
  setValue: UseFormSetValue<LoteFormValues>
  produtos: ProdutoConfig[]
  setores: Setor[]
  locais: LocalArmazenamento[]
  usuarios?: SystemUser[]
  exibirUsuario?: boolean
  exibirQuantidadeInicial?: boolean
  exibirQuantidadeAtual?: boolean
  exibirUnidade?: boolean
  exibirInclusao?: boolean
  loading: boolean
  submitLabel: string
}

export function LoteForm({
  register,
  control,
  errors,
  setValue,
  produtos,
  setores,
  locais,
  usuarios = [],
  exibirUsuario = true,
  exibirQuantidadeInicial = true,
  exibirQuantidadeAtual = true,
  exibirUnidade = true,
  exibirInclusao = true,
  loading,
  submitLabel,
}: LoteFormProps) {
  const productId = useWatch({ control, name: 'productId' })
  const unit = useWatch({ control, name: 'unit' }) as StockUnit | undefined

  const produtoSelecionado = produtos.find((produto) => produto.id === productId)
  const permiteCaixa = podeUsarCaixa(produtoSelecionado?.unitsPerPackage)

  useEffect(() => {
    if (!permiteCaixa && unit === 'BOX') {
      setValue('unit', 'UNIT')
    }
  }, [permiteCaixa, setValue, unit])

  const unidadeEntrada = unit === 'BOX' ? 'BOX' : 'UNIT'
  const labelQtd = labelUnidadePlural(unidadeEntrada)
  const labelValor = exibirUnidade
    ? unidadeEntrada === 'BOX'
      ? 'Valor (por caixa)'
      : 'Valor (por unidade)'
    : 'Custo unitario (unidade base)'

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
            onChange={(_, produto) => {
              onChange(produto?.id)
              if (!podeUsarCaixa(produto?.unitsPerPackage)) {
                setValue('unit', 'UNIT')
              }
            }}
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
      {exibirUnidade ? (
        <Controller
          name="unit"
          control={control}
          render={({ field }) => (
            <TextField
              select
              label="Unidade de entrada"
              value={field.value ?? 'UNIT'}
              onChange={(event) => field.onChange(event.target.value as StockUnit)}
              error={Boolean(errors.unit)}
              helperText={
                errors.unit?.message ??
                (permiteCaixa
                  ? `Produto com ${produtoSelecionado?.unitsPerPackage} un./caixa`
                  : 'Caixa disponivel apenas se o produto tiver mais de 1 un./caixa')
              }
            >
              <MenuItem value="UNIT">Unidade</MenuItem>
              <MenuItem value="BOX" disabled={!permiteCaixa}>
                Caixa
              </MenuItem>
            </TextField>
          )}
        />
      ) : null}
      {exibirQuantidadeInicial ? (
        <TextField
          label={
            exibirQuantidadeAtual
              ? `Qtd. inicial (${labelQtd})`
              : `Quantidade (${labelQtd})`
          }
          type="number"
          inputProps={{ min: 1, step: 1 }}
          error={Boolean(errors.initialQuantity)}
          helperText={errors.initialQuantity?.message}
          {...register('initialQuantity', { valueAsNumber: true })}
        />
      ) : null}
      {exibirQuantidadeAtual ? (
        <TextField
          label={`Qtd. atual (${labelQtd})`}
          type="number"
          inputProps={{ min: 1, step: 1 }}
          error={Boolean(errors.currentQuantity)}
          helperText={errors.currentQuantity?.message ?? 'Opcional. Se vazio, usa a quantidade inicial.'}
          {...register('currentQuantity', { valueAsNumber: true })}
        />
      ) : null}
      <Controller
        name="value"
        control={control}
        render={({ field: { onChange, onBlur, value, ref } }) => (
          <CampoValorMoeda
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            inputRef={ref}
            error={Boolean(errors.value)}
            helperText={errors.value?.message}
            label={labelValor}
          />
        )}
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
