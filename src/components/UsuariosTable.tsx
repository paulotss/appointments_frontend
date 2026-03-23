import EditIcon from '@mui/icons-material/Edit'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { Chip, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import type { SystemUser } from '../types/user'

interface UsuariosTableProps {
  usuarios: SystemUser[]
  onEditar: (usuario: SystemUser) => void
  onExcluir: (usuario: SystemUser) => void
}

export function UsuariosTable({ usuarios, onEditar, onExcluir }: UsuariosTableProps) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Nome</TableCell>
            <TableCell>Login</TableCell>
            <TableCell>Perfil</TableCell>
            <TableCell align="right">Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {usuarios.map((usuario) => (
            <TableRow key={usuario.id} hover>
              <TableCell>{usuario.name}</TableCell>
              <TableCell>{usuario.usernameLogin}</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={usuario.isAdmin ? 'Administrador' : 'Usuario'}
                  color={usuario.isAdmin ? 'primary' : 'default'}
                />
              </TableCell>
              <TableCell align="right">
                <IconButton size="small" aria-label="Editar usuario" onClick={() => onEditar(usuario)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  aria-label="Excluir usuario"
                  onClick={() => onExcluir(usuario)}
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
