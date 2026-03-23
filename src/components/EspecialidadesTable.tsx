import EditIcon from '@mui/icons-material/Edit'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import type { Especialidade } from '../types/registro'

interface EspecialidadesTableProps {
  especialidades: Especialidade[]
  onEditar: (especialidade: Especialidade) => void
  onExcluir: (especialidade: Especialidade) => void
}

export function EspecialidadesTable({
  especialidades,
  onEditar,
  onExcluir,
}: EspecialidadesTableProps) {
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
          {especialidades.map((especialidade) => (
            <TableRow key={especialidade.id} hover>
              <TableCell>{especialidade.nome}</TableCell>
              <TableCell align="right">
                <IconButton size="small" aria-label="Editar especialidade" onClick={() => onEditar(especialidade)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  aria-label="Excluir especialidade"
                  onClick={() => onExcluir(especialidade)}
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
