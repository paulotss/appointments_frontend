import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditIcon from '@mui/icons-material/Edit'
import { IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import type { Categoria } from '../types/estoque'

interface CategoriasTableProps {
  categorias: Categoria[]
  onEditar: (categoria: Categoria) => void
  onExcluir: (categoria: Categoria) => void
}

export function CategoriasTable({ categorias, onEditar, onExcluir }: CategoriasTableProps) {
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
          {categorias.map((categoria) => (
            <TableRow key={categoria.id} hover>
              <TableCell>{categoria.nome}</TableCell>
              <TableCell align="right">
                <IconButton
                  size="small"
                  aria-label="Editar categoria"
                  onClick={() => onEditar(categoria)}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  aria-label="Excluir categoria"
                  onClick={() => onExcluir(categoria)}
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
