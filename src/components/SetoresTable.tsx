import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditIcon from '@mui/icons-material/Edit'
import { Chip, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import type { Setor } from '../types/estoque'

interface SetoresTableProps {
  setores: Setor[]
  onEditar: (setor: Setor) => void
  onExcluir: (setor: Setor) => void
}

export function SetoresTable({ setores, onEditar, onExcluir }: SetoresTableProps) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Nome</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {setores.map((setor) => (
            <TableRow key={setor.id} hover>
              <TableCell>{setor.nome}</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={setor.isActive ? 'Ativo' : 'Inativo'}
                  color={setor.isActive ? 'success' : 'default'}
                />
              </TableCell>
              <TableCell align="right">
                <IconButton size="small" aria-label="Editar setor" onClick={() => onEditar(setor)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  aria-label="Excluir setor"
                  onClick={() => onExcluir(setor)}
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
