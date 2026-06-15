import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditIcon from '@mui/icons-material/Edit'
import {
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import type { LoteEstoque } from '../types/estoque'
import { normalizarValorLote } from '../services/stock-batches.service'

interface LotesTableProps {
  lotes: LoteEstoque[]
  onEditar: (lote: LoteEstoque) => void
  onExcluir: (lote: LoteEstoque) => void
}

const formatadorMoeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function formatarData(value: string | null | undefined): string {
  if (!value) return '-'

  const dataParte = value.includes('T') ? value.split('T')[0] : value.split(' ')[0]
  const [ano, mes, diaBruto] = dataParte.split('-')
  const dia = diaBruto?.slice(0, 2)

  if (!ano || !mes || !dia) return value

  return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`
}

function formatarValor(value: number | string | null | undefined): string {
  const numero = normalizarValorLote(value)
  if (numero == null) return '-'
  return formatadorMoeda.format(numero)
}

export function LotesTable({ lotes, onEditar, onExcluir }: LotesTableProps) {
  return (
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Produto</TableCell>
            <TableCell>Setor</TableCell>
            <TableCell>Qtd. inicial</TableCell>
            <TableCell>Qtd. atual</TableCell>
            <TableCell>Valor</TableCell>
            <TableCell>Inclusao</TableCell>
            <TableCell>Validade</TableCell>
            <TableCell>Usuario</TableCell>
            <TableCell>Chave NF-e</TableCell>
            <TableCell>Local</TableCell>
            <TableCell align="right">Acoes</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {lotes.map((lote) => (
            <TableRow key={lote.id} hover>
              <TableCell>{lote.product?.name ?? '-'}</TableCell>
              <TableCell>{lote.sector?.name ?? '-'}</TableCell>
              <TableCell>{lote.initialQuantity}</TableCell>
              <TableCell>{lote.currentQuantity}</TableCell>
              <TableCell>{formatarValor(lote.value)}</TableCell>
              <TableCell>{formatarData(lote.movementDate)}</TableCell>
              <TableCell>{formatarData(lote.expirationDate)}</TableCell>
              <TableCell>{lote.user?.name ?? '-'}</TableCell>
              <TableCell>{lote.invoiceAccessKey ?? '-'}</TableCell>
              <TableCell>{lote.location?.name ?? '-'}</TableCell>
              <TableCell align="right">
                <IconButton
                  size="small"
                  aria-label="Editar lote"
                  onClick={() => onEditar(lote)}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  aria-label="Excluir lote"
                  onClick={() => onExcluir(lote)}
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
