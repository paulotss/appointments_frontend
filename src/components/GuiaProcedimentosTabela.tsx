import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import type { InsuranceGuideProcedure } from '../types/guia'
import { saldoGuiaProcedimento } from '../types/guia'
import { tissCodeDoPlano } from '../types/procedimento'
import { formatarMoedaBRL } from '../utils/moedaBRL'

export type GuiaProcedimentoLinha = InsuranceGuideProcedure & {
  guiaLabel?: string
  healthPlanId?: number
}

interface GuiaProcedimentosTabelaProps {
  procedimentos: GuiaProcedimentoLinha[]
  emptyText?: string
}

export function GuiaProcedimentosTabela({
  procedimentos,
  emptyText = 'Nenhum procedimento nesta guia.',
}: GuiaProcedimentosTabelaProps) {
  if (procedimentos.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {emptyText}
      </Typography>
    )
  }

  const mostrarGuia = procedimentos.some((item) => Boolean(item.guiaLabel))

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            {mostrarGuia ? <TableCell>Guia</TableCell> : null}
            <TableCell>Procedimento</TableCell>
            <TableCell>TISS</TableCell>
            <TableCell align="right">Valor</TableCell>
            <TableCell align="right">Autorizado</TableCell>
            <TableCell align="right">Utilizado</TableCell>
            <TableCell align="right">Saldo</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {procedimentos.map((item, index) => (
            <TableRow key={`${item.insuranceGuideId}-${item.id || item.procedureId}-${index}`}>
              {mostrarGuia ? <TableCell>{item.guiaLabel ?? '—'}</TableCell> : null}
              <TableCell>{item.procedure?.name ?? `Procedimento ${item.procedureId}`}</TableCell>
              <TableCell>
                {item.healthPlanId != null
                  ? tissCodeDoPlano(item.procedure, item.healthPlanId) ?? '—'
                  : '—'}
              </TableCell>
              <TableCell align="right">{formatarMoedaBRL(item.value) || '—'}</TableCell>
              <TableCell align="right">{item.authorizedQuantity}</TableCell>
              <TableCell align="right">{item.usedQuantity}</TableCell>
              <TableCell align="right">{saldoGuiaProcedimento(item)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
