import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import {
  Box,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
} from '@mui/material'
import { Fragment, useMemo, useState } from 'react'
import type { SaidaEstoque } from '../types/estoque'

interface SaidasTableProps {
  saidas: SaidaEstoque[]
  produtosPorId: Record<number, string>
  locaisPorId: Record<number, string>
}

type ColunaOrdenacao = 'product' | 'location' | 'quantity' | 'professional' | 'exitDate'

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
    case 'quantity':
      return fator * (a.quantity - b.quantity)
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
    case 'professional':
      return (
        fator *
        (a.healthProfessional?.name ?? '').localeCompare(
          b.healthProfessional?.name ?? '',
          'pt-BR',
          { sensitivity: 'base' },
        )
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

function SaidaRow({
  saida,
  produtosPorId,
  locaisPorId,
}: {
  saida: SaidaEstoque
  produtosPorId: Record<number, string>
  locaisPorId: Record<number, string>
}) {
  const [open, setOpen] = useState(false)

  return (
    <Fragment>
      <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton
            size="small"
            aria-label={open ? 'Recolher detalhes' : 'Expandir detalhes'}
            onClick={() => setOpen((prev) => !prev)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{obterNomeProduto(saida, produtosPorId)}</TableCell>
        <TableCell>{obterNomeLocal(saida, locaisPorId)}</TableCell>
        <TableCell>{saida.quantity}</TableCell>
        <TableCell>{saida.healthProfessional?.name ?? '—'}</TableCell>
        <TableCell>{formatarData(saida.exitDate)}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={6} sx={{ py: 0, px: 0 }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ py: 1.5, px: 2, bgcolor: '#d6f4e8' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Lote</TableCell>
                    <TableCell>Usuário</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>{saida.batchId}</TableCell>
                    <TableCell>{saida.user?.name ?? '-'}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </Fragment>
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
            <TableCell />
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
              coluna="professional"
              label="Profissional"
              colunaAtiva={colunaOrdenacao}
              direcao={direcaoOrdenacao}
              onOrdenar={alternarOrdenacao}
            />
            <CabecalhoOrdenavel
              coluna="exitDate"
              label="Data da saída"
              colunaAtiva={colunaOrdenacao}
              direcao={direcaoOrdenacao}
              onOrdenar={alternarOrdenacao}
            />
          </TableRow>
        </TableHead>
        <TableBody>
          {saidasOrdenadas.map((saida) => (
            <SaidaRow
              key={saida.id}
              saida={saida}
              produtosPorId={produtosPorId}
              locaisPorId={locaisPorId}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
