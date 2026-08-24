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
import type { Payable, PayableStatus } from '../types/financeiro'
import { PAYABLE_KIND_LABELS, PAYABLE_STATUS_LABELS } from '../types/financeiro'
import { formatarDataISO } from '../utils/dataISO'
import { formatarMoedaBRL } from '../utils/moedaBRL'

interface PagamentosTableProps {
  pagamentos: Payable[]
}

function corStatus(status: PayableStatus) {
  if (status === 'paid') return 'success'
  if (status === 'pending') return 'warning'
  return 'default'
}

export function PagamentosTable({ pagamentos }: PagamentosTableProps) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Descrição</TableCell>
            <TableCell>Fornecedor</TableCell>
            <TableCell>Tipo</TableCell>
            <TableCell align="right">Valor</TableCell>
            <TableCell>Vencimento</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {pagamentos.map((item) => (
            <TableRow key={item.id} hover>
              <TableCell>
                <Link component={RouterLink} to={`/financeiro/pagamentos/${item.id}`}>
                  {item.description}
                </Link>
              </TableCell>
              <TableCell>{item.supplier?.tradeName ?? '—'}</TableCell>
              <TableCell>{PAYABLE_KIND_LABELS[item.kind]}</TableCell>
              <TableCell align="right">{formatarMoedaBRL(item.amount)}</TableCell>
              <TableCell>{formatarDataISO(item.dueDate)}</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={PAYABLE_STATUS_LABELS[item.status]}
                  color={corStatus(item.status)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
