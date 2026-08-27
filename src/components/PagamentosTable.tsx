import EditIcon from '@mui/icons-material/Edit'
import {
  Chip,
  IconButton,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
} from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import type { Payable, PayableSortField, PayableSortOrder, PayableStatus } from '../types/financeiro'
import { PAYABLE_KIND_LABELS, PAYABLE_STATUS_LABELS } from '../types/financeiro'
import { diasAteDataISO, formatarDataISO } from '../utils/dataISO'
import { formatarMoedaBRL } from '../utils/moedaBRL'

interface PagamentosTableProps {
  pagamentos: Payable[]
  colunaOrdenacao: PayableSortField | null
  direcaoOrdenacao: PayableSortOrder
  onOrdenar: (coluna: PayableSortField) => void
  onEditar: (pagamento: Payable) => void
}

function corStatus(status: PayableStatus) {
  if (status === 'paid') return 'success'
  if (status === 'pending') return 'warning'
  return 'default'
}

function sxVencimento(dueDate: string, status: PayableStatus) {
  if (status === 'paid') return undefined
  const dias = diasAteDataISO(dueDate)
  if (dias == null) return undefined
  if (dias <= 0) {
    return { color: 'error.main', fontWeight: 700 }
  }
  if (dias === 1) {
    return { color: 'warning.main', fontWeight: 700 }
  }
  return undefined
}

function CabecalhoOrdenavel({
  coluna,
  label,
  colunaAtiva,
  direcao,
  align,
  onOrdenar,
}: {
  coluna: PayableSortField
  label: string
  colunaAtiva: PayableSortField | null
  direcao: PayableSortOrder
  align?: 'left' | 'right'
  onOrdenar: (coluna: PayableSortField) => void
}) {
  return (
    <TableCell align={align} sortDirection={colunaAtiva === coluna ? direcao : false}>
      <TableSortLabel
        active={colunaAtiva === coluna}
        direction={colunaAtiva === coluna ? direcao : 'asc'}
        onClick={() => onOrdenar(coluna)}
      >
        {label}
      </TableSortLabel>
    </TableCell>
  )
}

export function PagamentosTable({
  pagamentos,
  colunaOrdenacao,
  direcaoOrdenacao,
  onOrdenar,
  onEditar,
}: PagamentosTableProps) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <CabecalhoOrdenavel
              coluna="description"
              label="Descrição"
              colunaAtiva={colunaOrdenacao}
              direcao={direcaoOrdenacao}
              onOrdenar={onOrdenar}
            />
            <CabecalhoOrdenavel
              coluna="supplier"
              label="Fornecedor"
              colunaAtiva={colunaOrdenacao}
              direcao={direcaoOrdenacao}
              onOrdenar={onOrdenar}
            />
            <CabecalhoOrdenavel
              coluna="kind"
              label="Tipo"
              colunaAtiva={colunaOrdenacao}
              direcao={direcaoOrdenacao}
              onOrdenar={onOrdenar}
            />
            <CabecalhoOrdenavel
              coluna="amount"
              label="Valor"
              colunaAtiva={colunaOrdenacao}
              direcao={direcaoOrdenacao}
              align="right"
              onOrdenar={onOrdenar}
            />
            <CabecalhoOrdenavel
              coluna="dueDate"
              label="Vencimento"
              colunaAtiva={colunaOrdenacao}
              direcao={direcaoOrdenacao}
              onOrdenar={onOrdenar}
            />
            <CabecalhoOrdenavel
              coluna="status"
              label="Status"
              colunaAtiva={colunaOrdenacao}
              direcao={direcaoOrdenacao}
              onOrdenar={onOrdenar}
            />
            <TableCell align="right">Ações</TableCell>
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
              <TableCell sx={sxVencimento(item.dueDate, item.status)}>{formatarDataISO(item.dueDate)}</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={PAYABLE_STATUS_LABELS[item.status]}
                  color={corStatus(item.status)}
                />
              </TableCell>
              <TableCell align="right">
                {item.status === 'pending' ? (
                  <IconButton
                    size="small"
                    aria-label="Editar pagamento"
                    onClick={() => onEditar(item)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
