import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditIcon from '@mui/icons-material/Edit'
import {
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import type { ProcedurePackage } from '../types/pacote'
import { aplicarDescontoPercentual } from '../types/pacote'
import { formatarMoedaBRL, parseValorDecimal } from '../utils/moedaBRL'

interface PacotesTableProps {
  pacotes: ProcedurePackage[]
  onEditar: (pacote: ProcedurePackage) => void
  onExcluir: (pacote: ProcedurePackage) => void
}

function totalPacote(pacote: ProcedurePackage): number {
  return pacote.items.reduce((sum, item) => {
    const catalogo = parseValorDecimal(item.procedure?.value) || 0
    return sum + aplicarDescontoPercentual(catalogo, pacote.discountPercent) * item.quantity
  }, 0)
}

export function PacotesTable({ pacotes, onEditar, onExcluir }: PacotesTableProps) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Nome</TableCell>
            <TableCell>Itens</TableCell>
            <TableCell align="right">Desconto</TableCell>
            <TableCell align="right">Total</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {pacotes.map((pacote) => (
            <TableRow key={pacote.id} hover>
              <TableCell>{pacote.name}</TableCell>
              <TableCell>
                {pacote.items
                  .map((item) => `${item.procedure?.name ?? `#${item.procedureId}`} × ${item.quantity}`)
                  .join(', ')}
              </TableCell>
              <TableCell align="right">{pacote.discountPercent}%</TableCell>
              <TableCell align="right">{formatarMoedaBRL(totalPacote(pacote))}</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={pacote.isActive ? 'Ativo' : 'Inativo'}
                  color={pacote.isActive ? 'success' : 'default'}
                />
              </TableCell>
              <TableCell align="right">
                <IconButton aria-label="Editar pacote" onClick={() => onEditar(pacote)}>
                  <EditIcon />
                </IconButton>
                <IconButton aria-label="Excluir pacote" onClick={() => onExcluir(pacote)}>
                  <DeleteOutlineIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
