import {
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
import type { BillingBatch, BillingBatchStatus } from '../types/financeiro'
import { BILLING_BATCH_STATUS_LABELS } from '../types/financeiro'
import { formatarDataISO } from '../utils/dataISO'
import { formatarMoedaBRL } from '../utils/moedaBRL'

interface TissLotesTableProps {
  lotes: BillingBatch[]
}

function corStatus(status: BillingBatchStatus) {
  if (status === 'open') return 'info'
  if (status === 'billed') return 'warning'
  if (status === 'settled') return 'success'
  return 'default'
}

export function TissLotesTable({ lotes }: TissLotesTableProps) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Lote</TableCell>
            <TableCell>Plano</TableCell>
            <TableCell>Protocolo</TableCell>
            <TableCell>Guias</TableCell>
            <TableCell align="right">Valor</TableCell>
            <TableCell align="right">Recebido</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Criado em</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {lotes.map((item) => (
            <TableRow key={item.id} hover>
              <TableCell>
                <Link component={RouterLink} to={`/tiss/lotes/${item.id}`}>
                  #{item.id}
                </Link>
              </TableCell>
              <TableCell>{item.healthPlan?.name ?? '—'}</TableCell>
              <TableCell>{item.protocolNumber ?? '—'}</TableCell>
              <TableCell>{item.guides.length}</TableCell>
              <TableCell align="right">{formatarMoedaBRL(item.billedAmount)}</TableCell>
              <TableCell align="right">{formatarMoedaBRL(item.receivedAmount)}</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={BILLING_BATCH_STATUS_LABELS[item.status]}
                  color={corStatus(item.status)}
                />
              </TableCell>
              <TableCell>{formatarDataISO(item.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
