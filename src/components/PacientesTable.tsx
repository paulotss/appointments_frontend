import EditIcon from '@mui/icons-material/Edit'
import { IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import type { Patient } from '../types/paciente'
import { formatarDataISO } from '../utils/dataISO'

interface PacientesTableProps {
  pacientes: Patient[]
  onEditar: (paciente: Patient) => void
}

function formatarCpf(cpf: string | null): string {
  if (!cpf) return '—'
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return cpf
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

export function PacientesTable({ pacientes, onEditar }: PacientesTableProps) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Nome</TableCell>
            <TableCell>CPF</TableCell>
            <TableCell>Nascimento</TableCell>
            <TableCell>Telefone</TableCell>
            <TableCell>E-mail</TableCell>
            <TableCell align="right">Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {pacientes.map((paciente) => (
            <TableRow key={paciente.id} hover>
              <TableCell>{paciente.name}</TableCell>
              <TableCell>{formatarCpf(paciente.cpf)}</TableCell>
              <TableCell>{formatarDataISO(paciente.birthDate)}</TableCell>
              <TableCell>{paciente.phone}</TableCell>
              <TableCell>{paciente.email ?? '—'}</TableCell>
              <TableCell align="right">
                <IconButton
                  size="small"
                  aria-label="Editar paciente"
                  onClick={() => onEditar(paciente)}
                >
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
