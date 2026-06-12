import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditIcon from '@mui/icons-material/Edit'
import { IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import type { LocalArmazenamento } from '../types/estoque'

interface LocaisTableProps {
  locais: LocalArmazenamento[]
  onEditar: (local: LocalArmazenamento) => void
  onExcluir: (local: LocalArmazenamento) => void
}

export function LocaisTable({ locais, onEditar, onExcluir }: LocaisTableProps) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Nome</TableCell>
            <TableCell align="right">Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {locais.map((local) => (
            <TableRow key={local.id} hover>
              <TableCell>{local.nome}</TableCell>
              <TableCell align="right">
                <IconButton size="small" aria-label="Editar local" onClick={() => onEditar(local)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  aria-label="Excluir local"
                  onClick={() => onExcluir(local)}
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
