import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
} from '@mui/material'
import { useMemo, useState } from 'react'
import type { SaidaEstoque } from '../types/estoque'

interface SaidasTableProps {
  saidas: SaidaEstoque[]
  produtosPorId: Record<number, string>
  locaisPorId: Record<number, string>
}

type ColunaOrdenacao =
  | 'batchId'
  | 'product'
  | 'location'
  | 'quantity'
  | 'user'
  | 'exitDate'

type DirecaoOrdenacao = 'asc' | 'desc'

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

function compararSaidas(
  a: SaidaEstoque,
  b: SaidaEstoque,
  coluna: ColunaOrdenacao,
  direcao: DirecaoOrdenacao,
  produtosPorId: Record<number, string>,
  locaisPorId: Record<number, string>,
): number {
  const fator = direcao === 'asc' ? 1 : -1

  switch (coluna) {
    case 'batchId':
    case 'quantity':
      return fator * (a[coluna] - b[coluna])
    case 'exitDate': {
      const dataA = a.exitDate ? new Date(a.exitDate).getTime() : 0
      const dataB = b.exitDate ? new Date(b.exitDate).getTime() : 0
      return fator * (dataA - dataB)
    }
    case 'product':
      return (
        fator *
        obterNomeProduto(a, produtosPorId).localeCompare(
          obterNomeProduto(b, produtosPorId),
          'pt-BR',
          { sensitivity: 'base' },
        )
      )
    case 'location':
      return (
        fator *
        obterNomeLocal(a, locaisPorId).localeCompare(obterNomeLocal(b, locaisPorId), 'pt-BR', {
          sensitivity: 'base',
        })
      )
    case 'user':
      return (
        fator *
        (a.user?.name ?? '').localeCompare(b.user?.name ?? '', 'pt-BR', {
          sensitivity: 'base',
        })
      )
    default:
      return 0
  }
}

function CabecalhoOrdenavel({
  coluna,
  label,
  colunaAtiva,
  direcao,
  onOrdenar,
}: {
  coluna: ColunaOrdenacao
  label: string
  colunaAtiva: ColunaOrdenacao
  direcao: DirecaoOrdenacao
  onOrdenar: (coluna: ColunaOrdenacao) => void
}) {
  return (
    <TableCell sortDirection={colunaAtiva === coluna ? direcao : false}>
      <TableSortLabel
        active={colunaAtiva === coluna}
        direction={colunaAtiva === coluna ? direcao : 'asc'}
        onClick={() => onOrdenar(coluna)}
      >
        {label}
      </TableSortLabel>
    </TableCell>
  )
}

export function SaidasTable({ saidas, produtosPorId, locaisPorId }: SaidasTableProps) {
  const [colunaOrdenacao, setColunaOrdenacao] = useState<ColunaOrdenacao>('exitDate')
  const [direcaoOrdenacao, setDirecaoOrdenacao] = useState<DirecaoOrdenacao>('desc')

  const saidasOrdenadas = useMemo(
    () =>
      [...saidas].sort((a, b) =>
        compararSaidas(a, b, colunaOrdenacao, direcaoOrdenacao, produtosPorId, locaisPorId),
      ),
    [colunaOrdenacao, direcaoOrdenacao, locaisPorId, produtosPorId, saidas],
  )

  function alternarOrdenacao(coluna: ColunaOrdenacao) {
    if (colunaOrdenacao === coluna) {
      setDirecaoOrdenacao((atual) => (atual === 'asc' ? 'desc' : 'asc'))
      return
    }

    setColunaOrdenacao(coluna)
    setDirecaoOrdenacao('asc')
  }

  return (
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <CabecalhoOrdenavel
              coluna="batchId"
              label="Lote"
              colunaAtiva={colunaOrdenacao}
              direcao={direcaoOrdenacao}
              onOrdenar={alternarOrdenacao}
            />
            <CabecalhoOrdenavel
              coluna="product"
              label="Produto"
              colunaAtiva={colunaOrdenacao}
              direcao={direcaoOrdenacao}
              onOrdenar={alternarOrdenacao}
            />
            <CabecalhoOrdenavel
              coluna="location"
              label="Local"
              colunaAtiva={colunaOrdenacao}
              direcao={direcaoOrdenacao}
              onOrdenar={alternarOrdenacao}
            />
            <CabecalhoOrdenavel
              coluna="quantity"
              label="Quantidade (un.)"
              colunaAtiva={colunaOrdenacao}
              direcao={direcaoOrdenacao}
              onOrdenar={alternarOrdenacao}
            />
            <CabecalhoOrdenavel
              coluna="user"
              label="Usuário"
              colunaAtiva={colunaOrdenacao}
              direcao={direcaoOrdenacao}
              onOrdenar={alternarOrdenacao}
            />
            <CabecalhoOrdenavel
              coluna="exitDate"
              label="Data Saída"
              colunaAtiva={colunaOrdenacao}
              direcao={direcaoOrdenacao}
              onOrdenar={alternarOrdenacao}
            />
          </TableRow>
        </TableHead>
        <TableBody>
          {saidasOrdenadas.map((saida) => (
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
