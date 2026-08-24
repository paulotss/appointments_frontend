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
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import { buscarLoteTiss, faturarLoteTiss } from '../services/billing-batches.service'
import {
  BILLING_BATCH_STATUS_LABELS,
  FINANCIAL_ENTRY_STATUS_LABELS,
  type BillingBatch,
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
  const { id: idParam } = useParams<{ id: string }>()
  const id = idParam != null && idParam !== '' ? Number.parseInt(idParam, 10) : Number.NaN

  const [lote, setLote] = useState<BillingBatch | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [dialogAberto, setDialogAberto] = useState(false)
  const [saving, setSaving] = useState(false)

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

  async function confirmarFaturar() {
    if (!lote) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const atualizado = await faturarLoteTiss(lote.id)
      setLote(atualizado)
      setDialogAberto(false)
      setSuccess('Lote faturado. A entrada financeira foi gerada.')
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível faturar o lote.'))
    } finally {
      setSaving(false)
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

      {error ? <Alert severity="error">{error}</Alert> : null}
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
            {lote.financialEntry ? (
              <Alert severity="info">
                Entrada #{lote.financialEntry.id} · {FINANCIAL_ENTRY_STATUS_LABELS[lote.financialEntry.status]} ·{' '}
                {formatarMoedaBRL(lote.financialEntry.amount)}.{' '}
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
                  <TableCell align="right">Valor</TableCell>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {lote.status === 'open' ? (
              <Button variant="contained" onClick={() => setDialogAberto(true)} sx={{ alignSelf: 'flex-start' }}>
                Faturar
              </Button>
            ) : null}
          </Stack>
        </Paper>
      ) : null}

      <Dialog open={dialogAberto} onClose={() => !saving && setDialogAberto(false)} fullWidth maxWidth="sm">
        <DialogTitle>Faturar lote</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mt: 0.5 }}>
            Confirma o faturamento deste lote? As guias serão marcadas como faturadas e uma nova entrada será
            gerada.
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
    </Stack>
  )
}
