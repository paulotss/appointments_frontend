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
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ReceberLoteDialog } from '../components/ReceberLoteDialog'
import { buscarLoteTiss, faturarLoteTiss, receberLoteTiss } from '../services/billing-batches.service'
import {
  BILLING_BATCH_STATUS_LABELS,
  FINANCIAL_ENTRY_STATUS_LABELS,
  type BillingBatch,
  type ReceiveBillingBatchRequest,
} from '../types/financeiro'
import { mensagemErroApi } from '../utils/apiError'
import { formatarDataHoraISO, formatarDataISO } from '../utils/dataISO'
import { formatarMoedaBRL } from '../utils/moedaBRL'

function corStatus(status: BillingBatch['status']) {
  if (status === 'open') return 'info'
  if (status === 'billed') return 'warning'
  if (status === 'settled') return 'success'
  return 'default'
}

export function LoteTissDetalhePage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { id: idParam } = useParams<{ id: string }>()
  const id = idParam != null && idParam !== '' ? Number.parseInt(idParam, 10) : Number.NaN
  const abrirReceber = searchParams.get('receber') === '1'

  const [lote, setLote] = useState<BillingBatch | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [dialogAberto, setDialogAberto] = useState(false)
  const [receberAberto, setReceberAberto] = useState(false)
  const [saving, setSaving] = useState(false)
  const [recebendo, setRecebendo] = useState(false)

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setLoading(false)
      setError('Identificador do lote inválido.')
      return
    }

    let cancelado = false
    async function carregar() {
      setLoading(true)
      setError(null)
      try {
        const data = await buscarLoteTiss(id)
        if (!cancelado) setLote(data)
      } catch (err) {
        if (!cancelado) setError(mensagemErroApi(err, 'Não foi possível carregar o lote.'))
      } finally {
        if (!cancelado) setLoading(false)
      }
    }
    void carregar()
    return () => {
      cancelado = true
    }
  }, [id])

  useEffect(() => {
    if (!lote || lote.status !== 'billed' || !abrirReceber) return
    setReceberAberto(true)
    const next = new URLSearchParams(searchParams)
    next.delete('receber')
    setSearchParams(next, { replace: true })
  }, [abrirReceber, lote, searchParams, setSearchParams])

  async function confirmarFaturar() {
    if (!lote) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const atualizado = await faturarLoteTiss(lote.id)
      setLote(atualizado)
      setDialogAberto(false)
      setSuccess('Lote faturado. A entrada financeira ficou pendente até o recebimento do plano.')
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível faturar o lote.'))
    } finally {
      setSaving(false)
    }
  }

  async function confirmarReceber(payload: ReceiveBillingBatchRequest) {
    if (!lote) return
    setRecebendo(true)
    setError(null)
    setSuccess(null)
    try {
      const atualizado = await receberLoteTiss(lote.id, payload)
      setLote(atualizado)
      setReceberAberto(false)
      setSuccess(
        atualizado.financialEntry?.status === 'partially_paid'
          ? 'Pagamento concluído com glosas. A entrada ficou parcialmente paga.'
          : 'Pagamento concluído.',
      )
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível concluir o pagamento.'))
    } finally {
      setRecebendo(false)
    }
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Lote {lote ? `#${lote.id}` : ''}
        </Typography>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/tiss/lotes')}>
          Voltar para listagem
        </Button>
      </Stack>

      {error && !receberAberto ? <Alert severity="error">{error}</Alert> : null}
      {success ? <Alert severity="success">{success}</Alert> : null}

      {loading ? (
        <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress size={20} />
          <Typography>Carregando lote...</Typography>
        </Paper>
      ) : null}

      {!loading && lote ? (
        <Paper sx={{ p: 3 }}>
          <Stack spacing={1.5}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
              <Typography variant="h6">{lote.healthPlan?.name ?? 'Plano'}</Typography>
              <Chip label={BILLING_BATCH_STATUS_LABELS[lote.status]} color={corStatus(lote.status)} />
            </Stack>
            <Typography>
              <strong>Protocolo:</strong> {lote.protocolNumber ?? '—'}
            </Typography>
            <Typography>
              <strong>Valor faturado:</strong> {formatarMoedaBRL(lote.billedAmount)}
            </Typography>
            <Typography>
              <strong>Recebido:</strong> {formatarMoedaBRL(lote.receivedAmount)}
            </Typography>
            <Typography>
              <strong>Criado em:</strong> {formatarDataISO(lote.createdAt)}
            </Typography>
            {lote.billedAt ? (
              <Typography>
                <strong>Faturado em:</strong> {formatarDataHoraISO(lote.billedAt)}
              </Typography>
            ) : null}
            {lote.settledAt ? (
              <Typography>
                <strong>Quitado em:</strong> {formatarDataHoraISO(lote.settledAt)}
              </Typography>
            ) : null}
            {lote.financialEntry ? (
              <Alert severity={lote.financialEntry.status === 'pending' ? 'warning' : 'info'}>
                Entrada #{lote.financialEntry.id} · {FINANCIAL_ENTRY_STATUS_LABELS[lote.financialEntry.status]} ·
                enviado {formatarMoedaBRL(lote.financialEntry.amount)}
                {lote.financialEntry.status !== 'pending'
                  ? ` · recebido ${formatarMoedaBRL(lote.financialEntry.receivedAmount)}`
                  : ''}
                .{' '}
                {lote.financialEntry.status === 'pending'
                  ? 'O pagamento permanece pendente até o recebimento do plano, quando o valor pode ser reduzido por glosas. '
                  : ''}
                <Link component={RouterLink} to="/financeiro/entradas">
                  Ver entradas
                </Link>
              </Alert>
            ) : null}

            <Typography variant="subtitle1" fontWeight={700} sx={{ pt: 1 }}>
              Guias
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Guia</TableCell>
                  <TableCell>Paciente</TableCell>
                  <TableCell>Profissional</TableCell>
                  <TableCell>Validade</TableCell>
                  <TableCell align="right">Enviado</TableCell>
                  <TableCell align="right">Recebido</TableCell>
                  <TableCell>Glosa</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lote.guides.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>#{item.insuranceGuideId}</TableCell>
                    <TableCell>{item.insuranceGuide?.patient?.name ?? '—'}</TableCell>
                    <TableCell>{item.insuranceGuide?.healthProfessional?.name ?? '—'}</TableCell>
                    <TableCell>{formatarDataISO(item.insuranceGuide?.expirationDate)}</TableCell>
                    <TableCell align="right">{formatarMoedaBRL(item.billedAmount)}</TableCell>
                    <TableCell align="right">
                      {item.receivedAmount == null ? '—' : formatarMoedaBRL(item.receivedAmount)}
                    </TableCell>
                    <TableCell>{item.glosaReason ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {lote.status === 'open' ? (
              <Button variant="contained" onClick={() => setDialogAberto(true)} sx={{ alignSelf: 'flex-start' }}>
                Faturar
              </Button>
            ) : null}
            {lote.status === 'billed' ? (
              <Button variant="contained" onClick={() => setReceberAberto(true)} sx={{ alignSelf: 'flex-start' }}>
                Concluir pagamento
              </Button>
            ) : null}
          </Stack>
        </Paper>
      ) : null}

      <Dialog open={dialogAberto} onClose={() => !saving && setDialogAberto(false)} fullWidth maxWidth="sm">
        <DialogTitle>Faturar lote</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mt: 0.5 }}>
            Confirma o faturamento deste lote? As guias serão marcadas como faturadas e uma entrada financeira
            pendente será gerada. O recebimento do plano (e eventuais glosas) poderá ser registrado depois.
          </Alert>
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

      {lote ? (
        <ReceberLoteDialog
          open={receberAberto}
          lote={lote}
          saving={recebendo}
          error={receberAberto ? error : null}
          onClose={() => setReceberAberto(false)}
          onConfirm={(payload) => void confirmarReceber(payload)}
        />
      ) : null}
    </Stack>
  )
}
