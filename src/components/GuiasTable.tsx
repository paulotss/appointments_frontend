import EditIcon from '@mui/icons-material/Edit'
import { IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import type { InsuranceGuide } from '../types/guia'
import { formatarDataISO, statusPrazoGuia } from '../utils/dataISO'

interface GuiasTableProps {
  guias: InsuranceGuide[]
  onEditar: (guia: InsuranceGuide) => void
}

export function GuiasTable({ guias, onEditar }: GuiasTableProps) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Paciente</TableCell>
            <TableCell>Plano</TableCell>
            <TableCell>Especialidade</TableCell>
            <TableCell>Profissional</TableCell>
            <TableCell>Quantidade</TableCell>
            <TableCell>Validade</TableCell>
            <TableCell align="right">Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {guias.map((guia) => {
            const status = statusPrazoGuia(guia.expirationDate)
            return (
              <TableRow
                key={guia.id}
                hover
                sx={
                  status === 'vencida'
                    ? {
                        bgcolor: 'error.light',
                        '&:hover': { bgcolor: 'error.light' },
                      }
                    : status === 'proxima'
                      ? {
                          bgcolor: 'warning.light',
                          '&:hover': { bgcolor: 'warning.light' },
                        }
                      : undefined
                }
              >
                <TableCell>{guia.patient?.name ?? '—'}</TableCell>
                <TableCell>{guia.healthPlan?.name ?? '—'}</TableCell>
                <TableCell>{guia.specialty?.name ?? '—'}</TableCell>
                <TableCell>{guia.healthProfessional?.name ?? '—'}</TableCell>
                <TableCell>{guia.quantity}</TableCell>
                <TableCell>{formatarDataISO(guia.expirationDate)}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" aria-label="Editar guia" onClick={() => onEditar(guia)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
