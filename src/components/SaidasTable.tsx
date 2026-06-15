import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import type { SaidaEstoque } from '../types/estoque'

interface SaidasTableProps {
  saidas: SaidaEstoque[]
  produtosPorId: Record<number, string>
  locaisPorId: Record<number, string>
}

function formatarData(value: string | null | undefined): string {
  if (!value) return '-'

  const dataParte = value.includes('T') ? value.split('T')[0] : value.split(' ')[0]
  const [ano, mes, diaBruto] = dataParte.split('-')
  const dia = diaBruto?.slice(0, 2)

  if (!ano || !mes || !dia) return value

  return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`
}

function obterNomeProduto(
  saida: SaidaEstoque,
  produtosPorId: Record<number, string>,
): string {
  return produtosPorId[saida.batch.productId] ?? saida.batch.product?.name ?? '-'
}

function obterNomeLocal(saida: SaidaEstoque, locaisPorId: Record<number, string>): string {
  return locaisPorId[saida.batch.locationId] ?? '-'
}

export function SaidasTable({ saidas, produtosPorId, locaisPorId }: SaidasTableProps) {
  return (
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Lote</TableCell>
            <TableCell>Produto</TableCell>
            <TableCell>Local</TableCell>
            <TableCell>Quantidade</TableCell>
            <TableCell>Usuario</TableCell>
            <TableCell>Data da saida</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {saidas.map((saida) => (
            <TableRow key={saida.id} hover>
              <TableCell>{saida.batchId}</TableCell>
              <TableCell>{obterNomeProduto(saida, produtosPorId)}</TableCell>
              <TableCell>{obterNomeLocal(saida, locaisPorId)}</TableCell>
              <TableCell>{saida.quantity}</TableCell>
              <TableCell>{saida.user?.name ?? '-'}</TableCell>
              <TableCell>{formatarData(saida.exitDate)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
