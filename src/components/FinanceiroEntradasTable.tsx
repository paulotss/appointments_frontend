import VisibilityIcon from '@mui/icons-material/Visibility'
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Link,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material'
import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { receberParcelaCartao } from '../services/financial-entries.service'
import type { FinancialEntry, FinancialEntryStatus, PaymentMethod } from '../types/financeiro'
import {
  FINANCIAL_ENTRY_STATUS_LABELS,
  FINANCIAL_ENTRY_TYPE_LABELS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  origemEntrada,
} from '../types/financeiro'
import { mensagemErroApi } from '../utils/apiError'
import { formatarDataHoraISO, formatarDataISO } from '../utils/dataISO'
import { formatarMoedaBRL } from '../utils/moedaBRL'

interface FinanceiroEntradasTableProps {
  entradas: FinancialEntry[]
  onChanged?: () => void
}

function corStatus(status: FinancialEntryStatus) {
  if (status === 'paid') return 'success'
  if (status === 'pending') return 'warning'
  if (status === 'partially_paid') return 'info'
  return 'default'
}

function loteIdDaEntrada(item: FinancialEntry): number | null {
  return item.billingBatchId ?? item.billingBatch?.id ?? null
}

export function FinanceiroEntradasTable({ entradas, onChanged }: FinanceiroEntradasTableProps) {
  const [recebendo, setRecebendo] = useState<FinancialEntry | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function confirmarRecebimento() {
    if (!recebendo) return
    setSalvando(true)
    setErro(null)
    try {
      await receberParcelaCartao(recebendo.id, { paymentMethod })
      setRecebendo(null)
      onChanged?.()
    } catch (err) {
      setErro(mensagemErroApi(err, 'Não foi possível receber a parcela.'))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <>
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Data</TableCell>
            <TableCell>Tipo</TableCell>
            <TableCell>Origem</TableCell>
            <TableCell>Vencimento</TableCell>
            <TableCell align="right">Valor</TableCell>
            <TableCell align="right">Recebido</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Pagamento</TableCell>
            <TableCell align="right">Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {entradas.map((item) => {
            const loteId = loteIdDaEntrada(item)
            const podeConcluir = item.type === 'health_plan' && item.status === 'pending' && loteId != null
            const podeReceber =
              item.type === 'benefit_subscription' && item.status === 'pending'
            return (
              <TableRow key={item.id} hover>
                <TableCell>{formatarDataHoraISO(item.paidAt ?? item.createdAt)}</TableCell>
                <TableCell>{FINANCIAL_ENTRY_TYPE_LABELS[item.type]}</TableCell>
                <TableCell>
                  {item.type === 'health_plan' && loteId != null ? (
                    <Link component={RouterLink} to={`/tiss/lotes/${loteId}`}>
                      {origemEntrada(item)}
                    </Link>
                  ) : (
                    origemEntrada(item)
                  )}
                </TableCell>
                <TableCell>{item.dueDate ? formatarDataISO(item.dueDate) : '—'}</TableCell>
                <TableCell align="right">{formatarMoedaBRL(item.amount)}</TableCell>
                <TableCell align="right">{formatarMoedaBRL(item.receivedAmount)}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={FINANCIAL_ENTRY_STATUS_LABELS[item.status]}
                    color={corStatus(item.status)}
                  />
                </TableCell>
                <TableCell>
                  {item.paymentMethod ? PAYMENT_METHOD_LABELS[item.paymentMethod] : '—'}
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <IconButton
                      component={RouterLink}
                      to={`/financeiro/entradas/${item.id}`}
                      size="small"
                      aria-label="Ver entrada"
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    {podeConcluir ? (
                      <Button
                        component={RouterLink}
                        to={`/tiss/lotes/${loteId}?receber=1`}
                        size="small"
                      >
                        Concluir
                      </Button>
                    ) : null}
                    {podeReceber ? (
                      <Button
                        size="small"
                        onClick={() => {
                          setErro(null)
                          setPaymentMethod('pix')
                          setRecebendo(item)
                        }}
                      >
                        Receber
                      </Button>
                    ) : null}
                  </Box>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
    <Dialog open={recebendo != null} onClose={() => setRecebendo(null)} fullWidth maxWidth="xs">
      <DialogTitle>Receber parcela do cartão</DialogTitle>
      <DialogContent>
        <TextField
          select
          fullWidth
          label="Forma de pagamento"
          value={paymentMethod}
          onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
          sx={{ mt: 1 }}
        >
          {PAYMENT_METHODS.map((method) => (
            <MenuItem key={method} value={method}>
              {PAYMENT_METHOD_LABELS[method]}
            </MenuItem>
          ))}
        </TextField>
        {erro ? <Alert severity="error" sx={{ mt: 2 }}>{erro}</Alert> : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setRecebendo(null)} disabled={salvando}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={() => void confirmarRecebimento()} disabled={salvando}>
          {salvando ? 'Salvando...' : 'Confirmar'}
        </Button>
      </DialogActions>
    </Dialog>
    </>
  )
}
