import {
  Button,
  Chip,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import type { FinancialEntry, FinancialEntryStatus } from '../types/financeiro'
import {
  FINANCIAL_ENTRY_STATUS_LABELS,
  FINANCIAL_ENTRY_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  origemEntrada,
} from '../types/financeiro'
import { formatarDataHoraISO } from '../utils/dataISO'
import { formatarMoedaBRL } from '../utils/moedaBRL'

interface FinanceiroEntradasTableProps {
  entradas: FinancialEntry[]
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

export function FinanceiroEntradasTable({ entradas }: FinanceiroEntradasTableProps) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Data</TableCell>
            <TableCell>Tipo</TableCell>
            <TableCell>Origem</TableCell>
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
                  {podeConcluir ? (
                    <Button
                      component={RouterLink}
                      to={`/tiss/lotes/${loteId}?receber=1`}
                      size="small"
                    >
                      Concluir
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
