import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditIcon from '@mui/icons-material/Edit'
import { IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import type { ProdutoConfig } from '../types/estoque'

interface ProdutosConfigTableProps {
  produtos: ProdutoConfig[]
  categoriasPorId: Record<number, string>
  onEditar: (produto: ProdutoConfig) => void
  onExcluir: (produto: ProdutoConfig) => void
}

export function ProdutosConfigTable({
  produtos,
  categoriasPorId,
  onEditar,
  onExcluir,
}: ProdutosConfigTableProps) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Nome</TableCell>
            <TableCell>SKU</TableCell>
            <TableCell>Categoria</TableCell>
            <TableCell>Estoque mínimo</TableCell>
            <TableCell align="right">Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {produtos.map((produto) => (
            <TableRow key={produto.id} hover>
              <TableCell>{produto.nome}</TableCell>
              <TableCell>{produto.sku}</TableCell>
              <TableCell>{categoriasPorId[produto.categoryId] ?? produto.categoryId}</TableCell>
              <TableCell>{produto.minimumStock}</TableCell>
              <TableCell align="right">
                <IconButton
                  size="small"
                  aria-label="Editar produto"
                  onClick={() => onEditar(produto)}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  aria-label="Inativar produto"
                  onClick={() => onExcluir(produto)}
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
