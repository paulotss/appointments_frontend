import EditIcon from '@mui/icons-material/Edit'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import { IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import type { InsuranceGuide } from '../types/guia'
import { formatarDataISO, statusPrazoGuia } from '../utils/dataISO'

interface GuiasTableProps {
  guias: InsuranceGuide[]
  onEditar: (guia: InsuranceGuide) => void
  onFaturar: (guia: InsuranceGuide) => void
}

function corLinhaGuia(guia: InsuranceGuide) {
  if (guia.isBilled) {
    return {
      bgcolor: 'success.light',
      '&:hover': { bgcolor: 'success.light' },
    }
  }
  const status = statusPrazoGuia(guia.expirationDate)
  if (status === 'vencida') {
    return {
      bgcolor: 'grey.300',
      '&:hover': { bgcolor: 'grey.300' },
    }
  }
  if (status === 'ultimoDia') {
    return {
      bgcolor: 'error.light',
      '&:hover': { bgcolor: 'error.light' },
    }
  }
  if (status === 'proxima') {
    return {
      bgcolor: 'warning.light',
      '&:hover': { bgcolor: 'warning.light' },
    }
  }
  return undefined
}

export function GuiasTable({ guias, onEditar, onFaturar }: GuiasTableProps) {
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
            return (
              <TableRow key={guia.id} hover sx={corLinhaGuia(guia)}>
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
                  {!guia.isBilled ? (
                    <IconButton size="small" aria-label="Faturar guia" onClick={() => onFaturar(guia)}>
                      <ReceiptLongIcon fontSize="small" />
                    </IconButton>
                  ) : null}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
