import { zodResolver } from '@hookform/resolvers/zod'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Alert, Button, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { CampoValorMoeda } from '../components/CampoValorMoeda'
import {
  pagamentoSchema,
  type PagamentoFormInput,
  type PagamentoFormValues,
} from '../schemas/financeiro.schema'
import { criarPagamento } from '../services/payables.service'
import { listarFornecedores } from '../services/suppliers.service'
import type { Fornecedor } from '../types/estoque'
import { PAYABLE_KINDS, PAYABLE_KIND_LABELS } from '../types/financeiro'
import { mensagemErroApi } from '../utils/apiError'
import { hojeLocalISO } from '../utils/dataISO'

export function NovoPagamentoPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PagamentoFormInput, unknown, PagamentoFormValues>({
    resolver: zodResolver(pagamentoSchema),
    defaultValues: {
      supplierId: undefined,
      kind: 'material',
      description: '',
      amount: undefined,
      dueDate: hojeLocalISO(),
      invoiceNumber: '',
      notes: '',
    },
  })

  useEffect(() => {
    async function carregarFornecedores() {
      try {
        setFornecedores(await listarFornecedores())
      } catch (err) {
        setError(mensagemErroApi(err, 'Não foi possível carregar os fornecedores.'))
      }
    }
    void carregarFornecedores()
  }, [])

  async function onSubmit(values: PagamentoFormValues) {
    setLoading(true)
    setError(null)
    try {
      const invoiceNumber = values.invoiceNumber?.trim()
      const notes = values.notes?.trim()
      const criado = await criarPagamento({
        supplierId: values.supplierId,
        kind: values.kind,
        description: values.description.trim(),
        amount: values.amount,
        dueDate: values.dueDate,
        ...(invoiceNumber ? { invoiceNumber } : {}),
        ...(notes ? { notes } : {}),
      })
      navigate(`/financeiro/pagamentos/${criado.id}`, { replace: true })
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível cadastrar o pagamento.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Novo pagamento
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/financeiro/pagamentos')}
        >
          Voltar para listagem
        </Button>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Stack component="form" spacing={2} sx={{ maxWidth: 540 }} onSubmit={handleSubmit(onSubmit)}>
        <Controller
          name="supplierId"
          control={control}
          render={({ field }) => (
            <TextField
              select
              label="Fornecedor"
              value={field.value ?? ''}
              onChange={(event) => field.onChange(Number(event.target.value))}
              error={Boolean(errors.supplierId)}
              helperText={errors.supplierId?.message ?? ' '}
            >
              {fornecedores.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.tradeName}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        <Controller
          name="kind"
          control={control}
          render={({ field }) => (
            <TextField
              select
              label="Tipo"
              value={field.value}
              onChange={field.onChange}
              error={Boolean(errors.kind)}
              helperText={errors.kind?.message ?? ' '}
            >
              {PAYABLE_KINDS.map((kind) => (
                <MenuItem key={kind} value={kind}>
                  {PAYABLE_KIND_LABELS[kind]}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        <TextField
          label="Descrição"
          error={Boolean(errors.description)}
          helperText={errors.description?.message}
          {...register('description')}
        />
        <Controller
          name="amount"
          control={control}
          render={({ field }) => (
            <CampoValorMoeda
              label="Valor"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              inputRef={field.ref}
              error={Boolean(errors.amount)}
              helperText={errors.amount?.message}
            />
          )}
        />
        <TextField
          label="Vencimento"
          type="date"
          InputLabelProps={{ shrink: true }}
          error={Boolean(errors.dueDate)}
          helperText={errors.dueDate?.message}
          {...register('dueDate')}
        />
        <TextField
          label="Número da nota"
          error={Boolean(errors.invoiceNumber)}
          helperText={errors.invoiceNumber?.message}
          {...register('invoiceNumber')}
        />
        <TextField
          label="Observações"
          multiline
          minRows={2}
          error={Boolean(errors.notes)}
          helperText={errors.notes?.message}
          {...register('notes')}
        />
        <Button type="submit" variant="contained" disabled={loading || fornecedores.length === 0}>
          {loading ? 'Salvando...' : 'Cadastrar'}
        </Button>
      </Stack>
    </Stack>
  )
}
