import {
  Alert,
  Autocomplete,
  Box,
  Button,
  MenuItem,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  TextField,
} from '@mui/material'
import { useMemo, useState } from 'react'
import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormResetField,
  type UseFormTrigger,
  type UseFormWatch,
} from 'react-hook-form'
import type { SaidaFormValues } from '../schemas/saida.schema'
import type { LoteEstoque, ProdutoConfig } from '../types/estoque'

interface SaidaFormProps {
  register: UseFormRegister<SaidaFormValues>
  control: Control<SaidaFormValues>
  errors: FieldErrors<SaidaFormValues>
  trigger: UseFormTrigger<SaidaFormValues>
  resetField: UseFormResetField<SaidaFormValues>
  watch: UseFormWatch<SaidaFormValues>
  produtos: ProdutoConfig[]
  lotes: LoteEstoque[]
  loading: boolean
  submitLabel: string
}

interface LocalDisponivel {
  id: number
  nome: string
}

function extrairLocaisUnicos(lotesDoProduto: LoteEstoque[]): LocalDisponivel[] {
  const map = new Map<number, string>()
  for (const lote of lotesDoProduto) {
    if (!map.has(lote.locationId)) {
      map.set(lote.locationId, lote.location?.name ?? `local #${lote.locationId}`)
    }
  }
  return Array.from(map, ([id, nome]) => ({ id, nome }))
}

function formatarData(value: string | null | undefined): string {
  if (!value) return 'sem validade'

  const dataParte = value.includes('T') ? value.split('T')[0] : value.split(' ')[0]
  const [ano, mes, diaBruto] = dataParte.split('-')
  const dia = diaBruto?.slice(0, 2)

  if (!ano || !mes || !dia) return value

  return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`
}

function formatarLabelLote(lote: LoteEstoque): string {
  return `Lote #${lote.id} — saldo: ${lote.currentQuantity} — validade: ${formatarData(lote.expirationDate)}`
}

const PASSOS = ['Produto', 'Local', 'Lote', 'Quantidade'] as const
const PASSO_CONTENT_SX = { width: '100%', maxWidth: 520 } as const

export function SaidaForm({
  register,
  control,
  errors,
  trigger,
  resetField,
  watch,
  produtos,
  lotes,
  loading,
  submitLabel,
}: SaidaFormProps) {
  const [activeStep, setActiveStep] = useState(0)
  const [semLoteAtivo, setSemLoteAtivo] = useState(false)

  const productId = watch('productId')
  const locationId = watch('locationId')
  const batchId = watch('batchId')

  const lotesDoProduto = useMemo(
    () => (productId != null ? lotes.filter((lote) => lote.productId === productId) : []),
    [lotes, productId],
  )

  const locaisDisponiveis = useMemo(
    () => extrairLocaisUnicos(lotesDoProduto),
    [lotesDoProduto],
  )

  const lotesDoLocal = useMemo(
    () =>
      locationId != null
        ? lotesDoProduto.filter((lote) => lote.locationId === locationId)
        : [],
    [lotesDoProduto, locationId],
  )

  const loteSelecionado = useMemo(
    () => (batchId != null ? lotes.find((lote) => lote.id === batchId) : undefined),
    [lotes, batchId],
  )

  function limparSelecoesDependentes() {
    resetField('locationId')
    resetField('batchId')
    setSemLoteAtivo(false)
  }

  async function avancarPasso(campos: (keyof SaidaFormValues)[]) {
    const valido = await trigger(campos)
    if (!valido) return

    if (activeStep === 0 && lotesDoProduto.length === 0) {
      setSemLoteAtivo(true)
      return
    }

    setSemLoteAtivo(false)
    setActiveStep((passo) => passo + 1)
  }

  function voltarPasso() {
    setSemLoteAtivo(false)
    setActiveStep((passo) => passo - 1)
  }

  return (
    <Stepper activeStep={activeStep} orientation="vertical" sx={{ maxWidth: 520, width: '100%' }}>
      <Step>
        <StepLabel>{PASSOS[0]}</StepLabel>
        <StepContent sx={PASSO_CONTENT_SX}>
          <Controller
            name="productId"
            control={control}
            render={({ field: { onChange, value, ref, onBlur } }) => (
              <Autocomplete
                fullWidth
                options={produtos}
                getOptionLabel={(produto) => produto.nome}
                isOptionEqualToValue={(option, selected) => option.id === selected.id}
                value={produtos.find((produto) => produto.id === value) ?? null}
                onChange={(_, produto) => {
                  onChange(produto?.id)
                  limparSelecoesDependentes()
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
          {semLoteAtivo ? (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Este produto nao possui lotes ativos com saldo.
            </Alert>
          ) : null}
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button variant="contained" onClick={() => void avancarPasso(['productId'])}>
              Continuar
            </Button>
          </Box>
        </StepContent>
      </Step>

      <Step>
        <StepLabel>{PASSOS[1]}</StepLabel>
        <StepContent sx={PASSO_CONTENT_SX}>
          <Controller
            name="locationId"
            control={control}
            render={({ field }) => (
              <TextField
                select
                fullWidth
                label="Local"
                value={field.value ?? ''}
                onChange={(event) => {
                  field.onChange(Number(event.target.value))
                  resetField('batchId')
                }}
                error={Boolean(errors.locationId)}
                helperText={errors.locationId?.message}
                InputLabelProps={{ shrink: true }}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (selected) => {
                    if (selected === '' || selected == null) {
                      return 'Selecione um local'
                    }
                    const local = locaisDisponiveis.find((item) => item.id === selected)
                    return local?.nome ?? 'Selecione um local'
                  },
                }}
              >
                <MenuItem value="" disabled>
                  Selecione um local
                </MenuItem>
                {locaisDisponiveis.map((local) => (
                  <MenuItem key={local.id} value={local.id}>
                    {local.nome}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button variant="contained" onClick={() => void avancarPasso(['locationId'])}>
              Continuar
            </Button>
            <Button onClick={voltarPasso}>Voltar</Button>
          </Box>
        </StepContent>
      </Step>

      <Step>
        <StepLabel>{PASSOS[2]}</StepLabel>
        <StepContent sx={PASSO_CONTENT_SX}>
          <Controller
            name="batchId"
            control={control}
            render={({ field }) => (
              <TextField
                select
                fullWidth
                label="Lote"
                value={field.value ?? ''}
                onChange={(event) => field.onChange(Number(event.target.value))}
                error={Boolean(errors.batchId)}
                helperText={errors.batchId?.message}
                InputLabelProps={{ shrink: true }}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (selected) => {
                    if (selected === '' || selected == null) {
                      return 'Selecione um lote'
                    }
                    const lote = lotesDoLocal.find((item) => item.id === selected)
                    return lote != null ? formatarLabelLote(lote) : 'Selecione um lote'
                  },
                }}
              >
                <MenuItem value="" disabled>
                  Selecione um lote
                </MenuItem>
                {lotesDoLocal.map((lote) => (
                  <MenuItem key={lote.id} value={lote.id}>
                    {formatarLabelLote(lote)}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button variant="contained" onClick={() => void avancarPasso(['batchId'])}>
              Continuar
            </Button>
            <Button onClick={voltarPasso}>Voltar</Button>
          </Box>
        </StepContent>
      </Step>

      <Step>
        <StepLabel>{PASSOS[3]}</StepLabel>
        <StepContent sx={PASSO_CONTENT_SX}>
          <TextField
            fullWidth
            label="Quantidade"
            type="number"
            inputProps={{ min: 1, step: 1, max: loteSelecionado?.currentQuantity }}
            error={Boolean(errors.quantity)}
            helperText={
              errors.quantity?.message ??
              (loteSelecionado != null
                ? `Saldo disponivel: ${loteSelecionado.currentQuantity}`
                : undefined)
            }
            {...register('quantity', { valueAsNumber: true })}
          />
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button type="submit" variant="contained" disabled={loading}>
              {submitLabel}
            </Button>
            <Button onClick={voltarPasso} disabled={loading}>
              Voltar
            </Button>
          </Box>
        </StepContent>
      </Step>
    </Stepper>
  )
}
