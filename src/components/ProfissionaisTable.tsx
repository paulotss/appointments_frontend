import EditIcon from '@mui/icons-material/Edit'
import { Chip, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import type { HealthProfessional } from '../types/profissional'

interface ProfissionaisTableProps {
  profissionais: HealthProfessional[]
  onEditar: (profissional: HealthProfessional) => void
}

function formatarCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return cpf
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

export function ProfissionaisTable({ profissionais, onEditar }: ProfissionaisTableProps) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Nome</TableCell>
            <TableCell>Especialidade</TableCell>
            <TableCell>Conselho</TableCell>
            <TableCell>CPF</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {profissionais.map((profissional) => (
            <TableRow key={profissional.id} hover>
              <TableCell>{profissional.name}</TableCell>
              <TableCell>{profissional.specialty?.name ?? '—'}</TableCell>
              <TableCell>
                {profissional.councilType} {profissional.councilNumber}
              </TableCell>
              <TableCell>{formatarCpf(profissional.cpf)}</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={profissional.isActive ? 'Ativo' : 'Inativo'}
                  color={profissional.isActive ? 'success' : 'default'}
                />
              </TableCell>
              <TableCell align="right">
                <IconButton
                  size="small"
                  aria-label="Editar profissional"
                  onClick={() => onEditar(profissional)}
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
