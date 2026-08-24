import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import type { FinancialExit } from '../types/financeiro'
import { PAYMENT_METHOD_LABELS } from '../types/financeiro'
import { formatarDataHoraISO } from '../utils/dataISO'
import { formatarMoedaBRL } from '../utils/moedaBRL'

interface FinanceiroSaidasTableProps {
  saidas: FinancialExit[]
}

export function FinanceiroSaidasTable({ saidas }: FinanceiroSaidasTableProps) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Data</TableCell>
            <TableCell>Fornecedor</TableCell>
            <TableCell>Conta a pagar</TableCell>
            <TableCell align="right">Valor</TableCell>
            <TableCell>Pagamento</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {saidas.map((item) => (
            <TableRow key={item.id} hover>
              <TableCell>{formatarDataHoraISO(item.paidAt)}</TableCell>
              <TableCell>{item.payable?.supplier?.tradeName ?? '—'}</TableCell>
              <TableCell>
                {item.payable ? (
                  <RouterLink to={`/financeiro/pagamentos/${item.payable.id}`}>
                    {item.payable.description}
                  </RouterLink>
                ) : (
                  '—'
                )}
              </TableCell>
              <TableCell align="right">{formatarMoedaBRL(item.amount)}</TableCell>
              <TableCell>{PAYMENT_METHOD_LABELS[item.paymentMethod]}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
