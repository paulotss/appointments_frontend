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
  Typography,
} from '@mui/material'
import { Fragment, useState } from 'react'
import type { LoteEstoque, ProdutoEstoqueConsolidado } from '../types/estoque'
import { normalizarValorLote } from '../services/stock-batches.service'

interface ProdutosEstoqueTableProps {
  produtos: ProdutoEstoqueConsolidado[]
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

function ContadorLotes({ valor, tipo }: { valor: number; tipo: 'expiring' | 'expired' }) {
  if (valor <= 0) return <>{valor}</>

  const cor = tipo === 'expired' ? 'error.main' : 'warning.main'
  return (
    <Typography component="span" color={cor} fontWeight={600}>
      {valor}
    </Typography>
  )
}

function LotesCollapse({ lotes }: { lotes: LoteEstoque[] }) {
  if (lotes.length === 0) {
    return (
      <Box sx={{ py: 2, px: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Nenhum lote
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ py: 1, px: 2 }}>
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
        <TableCell>{produto.totalQuantity}</TableCell>
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

export function ProdutosEstoqueTable({ produtos }: ProdutosEstoqueTableProps) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell>Nome</TableCell>
            <TableCell>SKU</TableCell>
            <TableCell>Quantidade total</TableCell>
            <TableCell>Preço médio</TableCell>
            <TableCell>Lotes a vencer</TableCell>
            <TableCell>Lotes vencidos</TableCell>
            <TableCell>Estoque mínimo</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {produtos.map((produto, index) => (
            <ProdutoEstoqueRow key={`${produto.sku}-${index}`} produto={produto} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
