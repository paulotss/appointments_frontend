import EditIcon from '@mui/icons-material/Edit'
import { IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import type { HealthPlan } from '../types/planoSaude'

interface PlanosSaudeTableProps {
  planos: HealthPlan[]
  onEditar: (plano: HealthPlan) => void
}

export function PlanosSaudeTable({ planos, onEditar }: PlanosSaudeTableProps) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Nome</TableCell>
            <TableCell>Prazo de envio (dias)</TableCell>
            <TableCell align="right">Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {planos.map((plano) => (
            <TableRow key={plano.id} hover>
              <TableCell>{plano.name}</TableCell>
              <TableCell>{plano.submissionDeadlineDays}</TableCell>
              <TableCell align="right">
                <IconButton size="small" aria-label="Editar plano de saude" onClick={() => onEditar(plano)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
