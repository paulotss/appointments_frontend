import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import {
  Box,
  Chip,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material'
import { Fragment, useMemo, useState } from 'react'
import type { LoteEstoque, ProdutoEstoqueConsolidado } from '../types/estoque'
import { normalizarValorLote } from '../services/stock-batches.service'

interface ProdutosEstoqueTableProps {
  produtos: ProdutoEstoqueConsolidado[]
}

type ColunaOrdenacao =
  | 'name'
  | 'sku'
  | 'totalQuantity'
  | 'averagePrice'
  | 'expiringBatchesCount'
  | 'expiredBatchesCount'
  | 'minimumStock'

type DirecaoOrdenacao = 'asc' | 'desc'

function compararProdutos(
  a: ProdutoEstoqueConsolidado,
  b: ProdutoEstoqueConsolidado,
  coluna: ColunaOrdenacao,
  direcao: DirecaoOrdenacao,
): number {
  const fator = direcao === 'asc' ? 1 : -1

  if (coluna === 'name' || coluna === 'sku') {
    return fator * a[coluna].localeCompare(b[coluna], 'pt-BR', { sensitivity: 'base' })
  }

  return fator * (a[coluna] - b[coluna])
}

const formatadorMoeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function formatarValor(value: number | string | null | undefined): string {
  const numero = normalizarValorLote(value)
  if (numero == null) return '-'
  return formatadorMoeda.format(numero)
}

function formatarData(value: string | null | undefined): string {
  if (!value) return '-'

  const dataParte = value.includes('T') ? value.split('T')[0] : value.split(' ')[0]
  const [ano, mes, diaBruto] = dataParte.split('-')
  const dia = diaBruto?.slice(0, 2)

  if (!ano || !mes || !dia) return value

  return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`
}

const MARGEM_ESTOQUE_MINIMO = 10

function ContadorLotes({ valor, tipo }: { valor: number; tipo: 'expiring' | 'expired' }) {
  if (valor <= 0) {
    return <Chip size="small" label={valor} color="primary" />
  }

  return (
    <Chip
      size="small"
      label={valor}
      color={tipo === 'expired' ? 'error' : 'warning'}
    />
  )
}

function QuantidadeTotal({ quantidade, estoqueMinimo }: { quantidade: number; estoqueMinimo: number }) {
  if (quantidade <= estoqueMinimo) {
    return <Chip size="small" label={quantidade} color="error" />
  }

  if (quantidade <= estoqueMinimo + MARGEM_ESTOQUE_MINIMO) {
    return <Chip size="small" label={quantidade} color="warning" />
  }

  return <Chip size="small" label={quantidade} color="primary" />
}

function LotesCollapse({ lotes }: { lotes: LoteEstoque[] }) {
  if (lotes.length === 0) {
    return (
      <Box sx={{ py: 2, px: 3, bgcolor: '#d6f4e8' }}>
        <Typography variant="body2" color="text.secondary">
          Nenhum lote
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ py: 1, px: 2, bgcolor: '#d6f4e8' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Setor</TableCell>
            <TableCell>Quantidade inicial</TableCell>
            <TableCell>Quantidade atual</TableCell>
            <TableCell>Valor</TableCell>
            <TableCell>Data de movimentação</TableCell>
            <TableCell>Data de validade</TableCell>
            <TableCell>Local</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {lotes.map((lote) => (
            <TableRow key={lote.id} hover>
              <TableCell>{lote.sector?.name ?? '-'}</TableCell>
              <TableCell>{lote.initialQuantity}</TableCell>
              <TableCell>{lote.currentQuantity}</TableCell>
              <TableCell>{formatarValor(lote.value)}</TableCell>
              <TableCell>{formatarData(lote.movementDate)}</TableCell>
              <TableCell>{formatarData(lote.expirationDate)}</TableCell>
              <TableCell>{lote.location?.name ?? '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  )
}

function ProdutoEstoqueRow({ produto }: { produto: ProdutoEstoqueConsolidado }) {
  const [open, setOpen] = useState(false)

  return (
    <Fragment>
      <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton
            size="small"
            aria-label={open ? 'Recolher lotes' : 'Expandir lotes'}
            onClick={() => setOpen((prev) => !prev)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{produto.name}</TableCell>
        <TableCell>{produto.sku}</TableCell>
        <TableCell>
          <QuantidadeTotal quantidade={produto.totalQuantity} estoqueMinimo={produto.minimumStock} />
        </TableCell>
        <TableCell>{formatadorMoeda.format(produto.averagePrice)}</TableCell>
        <TableCell>
          <ContadorLotes valor={produto.expiringBatchesCount} tipo="expiring" />
        </TableCell>
        <TableCell>
          <ContadorLotes valor={produto.expiredBatchesCount} tipo="expired" />
        </TableCell>
        <TableCell>{produto.minimumStock}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={8} sx={{ py: 0, px: 0 }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <LotesCollapse lotes={produto.stockBatches} />
          </Collapse>
        </TableCell>
      </TableRow>
    </Fragment>
  )
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

export function ProdutosEstoqueTable({ produtos }: ProdutosEstoqueTableProps) {
  const [colunaOrdenacao, setColunaOrdenacao] = useState<ColunaOrdenacao>('name')
  const [direcaoOrdenacao, setDirecaoOrdenacao] = useState<DirecaoOrdenacao>('asc')

  const produtosOrdenados = useMemo(
    () =>
      [...produtos].sort((a, b) => compararProdutos(a, b, colunaOrdenacao, direcaoOrdenacao)),
    [colunaOrdenacao, direcaoOrdenacao, produtos],
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
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell />
            <CabecalhoOrdenavel
              coluna="name"
              label="Nome"
              colunaAtiva={colunaOrdenacao}
              direcao={direcaoOrdenacao}
              onOrdenar={alternarOrdenacao}
            />
            <CabecalhoOrdenavel
              coluna="sku"
              label="SKU"
              colunaAtiva={colunaOrdenacao}
              direcao={direcaoOrdenacao}
              onOrdenar={alternarOrdenacao}
            />
            <CabecalhoOrdenavel
              coluna="totalQuantity"
              label="Quantidade total"
              colunaAtiva={colunaOrdenacao}
              direcao={direcaoOrdenacao}
              onOrdenar={alternarOrdenacao}
            />
            <CabecalhoOrdenavel
              coluna="averagePrice"
              label="Preço médio"
              colunaAtiva={colunaOrdenacao}
              direcao={direcaoOrdenacao}
              onOrdenar={alternarOrdenacao}
            />
            <CabecalhoOrdenavel
              coluna="expiringBatchesCount"
              label="Lotes a vencer"
              colunaAtiva={colunaOrdenacao}
              direcao={direcaoOrdenacao}
              onOrdenar={alternarOrdenacao}
            />
            <CabecalhoOrdenavel
              coluna="expiredBatchesCount"
              label="Lotes vencidos"
              colunaAtiva={colunaOrdenacao}
              direcao={direcaoOrdenacao}
              onOrdenar={alternarOrdenacao}
            />
            <CabecalhoOrdenavel
              coluna="minimumStock"
              label="Estoque mínimo"
              colunaAtiva={colunaOrdenacao}
              direcao={direcaoOrdenacao}
              onOrdenar={alternarOrdenacao}
            />
          </TableRow>
        </TableHead>
        <TableBody>
          {produtosOrdenados.map((produto, index) => (
            <ProdutoEstoqueRow key={`${produto.sku}-${index}`} produto={produto} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
