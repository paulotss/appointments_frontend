import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { useEffect } from 'react'
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form'
import {
  receberLoteSchema,
  type ReceberLoteFormInput,
  type ReceberLoteFormValues,
} from '../schemas/financeiro.schema'
import type { BillingBatch, ReceiveBillingBatchRequest } from '../types/financeiro'
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from '../types/financeiro'
import { formatarMoedaBRL } from '../utils/moedaBRL'
import { CampoValorMoeda } from './CampoValorMoeda'
import { CampoDataHora } from './CampoDataHora'

function agoraDatetimeLocal(): string {
  const data = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}T${pad(data.getHours())}:${pad(data.getMinutes())}`
}

function datetimeLocalParaIso(value: string | undefined): string | undefined {
  if (!value) return undefined
  const data = new Date(value)
  if (Number.isNaN(data.getTime())) return undefined
  return data.toISOString()
}

function arredondarCentavos(value: number): number {
  return Math.round(value * 100) / 100
}

interface ReceberLoteDialogProps {
  open: boolean
  lote: BillingBatch
  saving: boolean
  error?: string | null
  onClose: () => void
  onConfirm: (payload: ReceiveBillingBatchRequest) => void
}

export function ReceberLoteDialog({
  open,
  lote,
  saving,
  error,
  onClose,
  onConfirm,
}: ReceberLoteDialogProps) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReceberLoteFormInput, unknown, ReceberLoteFormValues>({
    resolver: zodResolver(receberLoteSchema),
    defaultValues: {
      paymentMethod: 'pix',
      paidAt: agoraDatetimeLocal(),
      items: [],
    },
  })

  const { fields } = useFieldArray({ control, name: 'items' })
  const items = useWatch({ control, name: 'items' })
  const totalRecebido = arredondarCentavos(
    (items ?? []).reduce((total, item) => total + (item.receivedAmount ?? 0), 0),
  )
  const glosas = arredondarCentavos(lote.billedAmount - totalRecebido)

  useEffect(() => {
    if (!open) return
    reset({
      paymentMethod: 'pix',
      paidAt: agoraDatetimeLocal(),
      items: lote.guides.map((guia) => ({
        insuranceGuideId: guia.insuranceGuideId,
        billedAmount: guia.billedAmount,
        receivedAmount: guia.billedAmount,
        glosaReason: '',
      })),
    })
  }, [lote, open, reset])

  function onSubmit(values: ReceberLoteFormValues) {
    const receivedAmount = arredondarCentavos(
      values.items.reduce((total, item) => total + item.receivedAmount, 0),
    )
    onConfirm({
      receivedAmount,
      paymentMethod: values.paymentMethod,
      paidAt: datetimeLocalParaIso(values.paidAt),
      items: values.items.map((item) => ({
        insuranceGuideId: item.insuranceGuideId,
        receivedAmount: arredondarCentavos(item.receivedAmount),
        ...(item.receivedAmount < item.billedAmount && item.glosaReason?.trim()
          ? { glosaReason: item.glosaReason.trim() }
          : {}),
      })),
    })
  }

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} fullWidth maxWidth="md">
      <DialogTitle>Concluir pagamento</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }} component="form" id="receber-lote-form" onSubmit={handleSubmit(onSubmit)}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <Alert severity="info">
            Informe o valor efetivamente recebido do plano. Se houver glosa, reduza o valor da guia e descreva o
            motivo.
          </Alert>
          <Controller
            name="paymentMethod"
            control={control}
            render={({ field }) => (
              <TextField
                select
                label="Forma de pagamento"
                value={field.value}
                onChange={field.onChange}
                error={Boolean(errors.paymentMethod)}
                helperText={errors.paymentMethod?.message ?? ' '}
              >
                {PAYMENT_METHODS.map((method) => (
                  <MenuItem key={method} value={method}>
                    {PAYMENT_METHOD_LABELS[method]}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          <Controller
            name="paidAt"
            control={control}
            render={({ field }) => (
              <CampoDataHora
                label="Data do pagamento"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                inputRef={field.ref}
                error={Boolean(errors.paidAt)}
                helperText={errors.paidAt?.message}
              />
            )}
          />
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Guia</TableCell>
                <TableCell>Paciente</TableCell>
                <TableCell align="right">Enviado</TableCell>
                <TableCell>Recebido</TableCell>
                <TableCell>Motivo da glosa</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fields.map((field, index) => {
                const guia = lote.guides[index]
                const recebido = items?.[index]?.receivedAmount ?? 0
                const enviado = field.billedAmount
                return (
                  <TableRow key={field.id}>
                    <TableCell>#{guia?.insuranceGuideId ?? field.insuranceGuideId}</TableCell>
                    <TableCell>{guia?.insuranceGuide?.patient?.name ?? '—'}</TableCell>
                    <TableCell align="right">{formatarMoedaBRL(enviado)}</TableCell>
                    <TableCell sx={{ minWidth: 150, verticalAlign: 'top' }}>
                      <Controller
                        name={`items.${index}.receivedAmount`}
                        control={control}
                        render={({ field: valorField }) => (
                          <CampoValorMoeda
                            size="small"
                            fullWidth
                            value={valorField.value}
                            onChange={(value) => valorField.onChange(value ?? 0)}
                            onBlur={valorField.onBlur}
                            inputRef={valorField.ref}
                            error={Boolean(errors.items?.[index]?.receivedAmount)}
                            helperText={errors.items?.[index]?.receivedAmount?.message}
                          />
                        )}
                      />
                    </TableCell>
                    <TableCell sx={{ minWidth: 220, verticalAlign: 'top' }}>
                      <TextField
                        size="small"
                        fullWidth
                        placeholder={recebido < enviado ? 'Obrigatório' : 'Opcional'}
                        error={Boolean(errors.items?.[index]?.glosaReason)}
                        helperText={errors.items?.[index]?.glosaReason?.message}
                        {...register(`items.${index}.glosaReason`)}
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <Stack spacing={0.5}>
            <Typography>
              <strong>Valor enviado:</strong> {formatarMoedaBRL(lote.billedAmount)}
            </Typography>
            <Typography>
              <strong>Valor recebido:</strong> {formatarMoedaBRL(totalRecebido)}
            </Typography>
            {glosas > 0 ? (
              <Alert severity="warning">
                Há glosas de {formatarMoedaBRL(glosas)}. A entrada ficará como parcialmente paga.
              </Alert>
            ) : null}
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" form="receber-lote-form" variant="contained" disabled={saving}>
          {saving ? 'Concluindo...' : 'Confirmar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
