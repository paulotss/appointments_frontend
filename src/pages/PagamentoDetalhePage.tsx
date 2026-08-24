import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { buscarPagamento, faturarPagamento } from '../services/payables.service'
import {
  PAYABLE_KIND_LABELS,
  PAYABLE_STATUS_LABELS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  type Payable,
  type PaymentMethod,
} from '../types/financeiro'
import { mensagemErroApi } from '../utils/apiError'
import { formatarDataHoraISO, formatarDataISO } from '../utils/dataISO'
import { formatarMoedaBRL } from '../utils/moedaBRL'

function agoraDatetimeLocal(): string {
  const data = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}T${pad(data.getHours())}:${pad(data.getMinutes())}`
}

function datetimeLocalParaIso(value: string): string | undefined {
  if (!value) return undefined
  const data = new Date(value)
  if (Number.isNaN(data.getTime())) return undefined
  return data.toISOString()
}

function corStatus(status: Payable['status']) {
  if (status === 'paid') return 'success'
  if (status === 'pending') return 'warning'
  return 'default'
}

export function PagamentoDetalhePage() {
  const navigate = useNavigate()
  const { id: idParam } = useParams<{ id: string }>()
  const id = idParam != null && idParam !== '' ? Number.parseInt(idParam, 10) : Number.NaN

  const [pagamento, setPagamento] = useState<Payable | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [dialogAberto, setDialogAberto] = useState(false)
  const [saving, setSaving] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix')
  const [paidAt, setPaidAt] = useState(agoraDatetimeLocal())

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setLoading(false)
      setError('Identificador do pagamento inválido.')
      return
    }

    let cancelado = false
    async function carregar() {
      setLoading(true)
      setError(null)
      try {
        const data = await buscarPagamento(id)
        if (!cancelado) setPagamento(data)
      } catch (err) {
        if (!cancelado) setError(mensagemErroApi(err, 'Não foi possível carregar o pagamento.'))
      } finally {
        if (!cancelado) setLoading(false)
      }
    }
    void carregar()
    return () => {
      cancelado = true
    }
  }, [id])

  async function confirmarFaturar() {
    if (!pagamento) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const atualizado = await faturarPagamento(pagamento.id, {
        paymentMethod,
        paidAt: datetimeLocalParaIso(paidAt),
      })
      setPagamento(atualizado)
      setDialogAberto(false)
      setSuccess('Pagamento faturado. A saída financeira foi gerada.')
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível faturar o pagamento.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Pagamento
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
      {success ? <Alert severity="success">{success}</Alert> : null}

      {loading ? (
        <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress size={20} />
          <Typography>Carregando pagamento...</Typography>
        </Paper>
      ) : null}

      {!loading && pagamento ? (
        <Paper sx={{ p: 3 }}>
          <Stack spacing={1.5}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
              <Typography variant="h6">{pagamento.description}</Typography>
              <Chip
                label={PAYABLE_STATUS_LABELS[pagamento.status]}
                color={corStatus(pagamento.status)}
              />
            </Stack>
            <Typography>
              <strong>Fornecedor:</strong> {pagamento.supplier?.tradeName ?? '—'}
            </Typography>
            <Typography>
              <strong>Tipo:</strong> {PAYABLE_KIND_LABELS[pagamento.kind]}
            </Typography>
            <Typography>
              <strong>Valor:</strong> {formatarMoedaBRL(pagamento.amount)}
            </Typography>
            <Typography>
              <strong>Vencimento:</strong> {formatarDataISO(pagamento.dueDate)}
            </Typography>
            <Typography>
              <strong>Nota:</strong> {pagamento.invoiceNumber ?? '—'}
            </Typography>
            <Typography>
              <strong>Observações:</strong> {pagamento.notes ?? '—'}
            </Typography>
            {pagamento.financialExit ? (
              <Alert severity="info">
                Saída #{pagamento.financialExit.id} gerada em{' '}
                {formatarDataHoraISO(pagamento.financialExit.paidAt)} via{' '}
                {PAYMENT_METHOD_LABELS[pagamento.financialExit.paymentMethod]} (
                {formatarMoedaBRL(pagamento.financialExit.amount)}).
              </Alert>
            ) : null}
            {pagamento.status === 'pending' ? (
              <Button
                variant="contained"
                onClick={() => {
                  setPaidAt(agoraDatetimeLocal())
                  setDialogAberto(true)
                }}
                sx={{ alignSelf: 'flex-start' }}
              >
                Faturar
              </Button>
            ) : null}
          </Stack>
        </Paper>
      ) : null}

      <Dialog open={dialogAberto} onClose={() => !saving && setDialogAberto(false)} fullWidth maxWidth="sm">
        <DialogTitle>Faturar pagamento</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Forma de pagamento"
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
            >
              {PAYMENT_METHODS.map((method) => (
                <MenuItem key={method} value={method}>
                  {PAYMENT_METHOD_LABELS[method]}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Data do pagamento"
              type="datetime-local"
              value={paidAt}
              onChange={(event) => setPaidAt(event.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogAberto(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={() => void confirmarFaturar()} disabled={saving}>
            {saving ? 'Faturando...' : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
