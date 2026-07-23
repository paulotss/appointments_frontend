import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditIcon from '@mui/icons-material/Edit'
import { IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import type { Fornecedor } from '../types/estoque'
import { formatarCnpj, formatarTelefone } from '../utils/fornecedorFormat'

interface FornecedoresTableProps {
  fornecedores: Fornecedor[]
  onEditar: (fornecedor: Fornecedor) => void
  onExcluir: (fornecedor: Fornecedor) => void
}

export function FornecedoresTable({ fornecedores, onEditar, onExcluir }: FornecedoresTableProps) {
  return (
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Nome fantasia</TableCell>
            <TableCell>Razão social</TableCell>
            <TableCell>CNPJ</TableCell>
            <TableCell>Telefone</TableCell>
            <TableCell>E-mail</TableCell>
            <TableCell align="right">Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {fornecedores.map((fornecedor) => (
            <TableRow key={fornecedor.id} hover>
              <TableCell>{fornecedor.tradeName}</TableCell>
              <TableCell>{fornecedor.legalName}</TableCell>
              <TableCell>{formatarCnpj(fornecedor.cnpj)}</TableCell>
              <TableCell>{formatarTelefone(fornecedor.phone)}</TableCell>
              <TableCell>{fornecedor.email}</TableCell>
              <TableCell align="right">
                <IconButton
                  size="small"
                  aria-label="Editar fornecedor"
                  onClick={() => onEditar(fornecedor)}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  aria-label="Excluir fornecedor"
                  onClick={() => onExcluir(fornecedor)}
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
