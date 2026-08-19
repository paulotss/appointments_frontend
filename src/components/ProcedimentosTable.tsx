import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditIcon from '@mui/icons-material/Edit'
import { IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import type { Procedure } from '../types/procedimento'
import { formatarMoedaBRL } from '../utils/moedaBRL'

interface ProcedimentosTableProps {
  procedimentos: Procedure[]
  onEditar: (procedimento: Procedure) => void
  onExcluir: (procedimento: Procedure) => void
}

export function ProcedimentosTable({ procedimentos, onEditar, onExcluir }: ProcedimentosTableProps) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>TISS</TableCell>
            <TableCell>Nome</TableCell>
            <TableCell>Especialidade</TableCell>
            <TableCell>Valor particular</TableCell>
            <TableCell>Convênios</TableCell>
            <TableCell align="right">Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {procedimentos.map((procedimento) => (
            <TableRow key={procedimento.id} hover>
              <TableCell>{procedimento.tissCode}</TableCell>
              <TableCell>{procedimento.name}</TableCell>
              <TableCell>{procedimento.specialty?.name ?? '—'}</TableCell>
              <TableCell>{formatarMoedaBRL(procedimento.value) || '—'}</TableCell>
              <TableCell>
                {procedimento.healthPlanPrices.length === 0
                  ? '—'
                  : procedimento.healthPlanPrices
                      .map(
                        (item) =>
                          `${item.healthPlan?.name ?? `Plano ${item.healthPlanId}`}: ${formatarMoedaBRL(item.value) || '—'}`,
                      )
                      .join(' · ')}
              </TableCell>
              <TableCell align="right">
                <IconButton
                  size="small"
                  aria-label="Editar procedimento"
                  onClick={() => onEditar(procedimento)}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  aria-label="Excluir procedimento"
                  onClick={() => onExcluir(procedimento)}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
