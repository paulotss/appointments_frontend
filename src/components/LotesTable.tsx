import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import EditIcon from '@mui/icons-material/Edit'
import {
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
} from '@mui/material'
import { useMemo, useState } from 'react'
import type { LoteEstoque } from '../types/estoque'
import { normalizarValorLote } from '../services/stock-batches.service'

interface LotesTableProps {
  lotes: LoteEstoque[]
  onEditar: (lote: LoteEstoque) => void
  onFechar: (lote: LoteEstoque) => void
  onChaveCopiada?: () => void
}

type ColunaOrdenacao =
  | 'id'
  | 'product'
  | 'sector'
  | 'initialQuantity'
  | 'currentQuantity'
  | 'value'
  | 'movementDate'
  | 'expirationDate'
  | 'user'
  | 'location'

type DirecaoOrdenacao = 'asc' | 'desc'

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

function compararLotes(
  a: LoteEstoque,
  b: LoteEstoque,
  coluna: ColunaOrdenacao,
  direcao: DirecaoOrdenacao,
): number {
  const fator = direcao === 'asc' ? 1 : -1

  switch (coluna) {
    case 'id':
    case 'initialQuantity':
    case 'currentQuantity':
      return fator * (a[coluna] - b[coluna])
    case 'value': {
      const valorA = normalizarValorLote(a.value) ?? 0
      const valorB = normalizarValorLote(b.value) ?? 0
      return fator * (valorA - valorB)
    }
    case 'movementDate':
    case 'expirationDate': {
      const dataA = a[coluna] ? new Date(a[coluna]).getTime() : 0
      const dataB = b[coluna] ? new Date(b[coluna]!).getTime() : 0
      return fator * (dataA - dataB)
    }
    case 'product':
      return (
        fator *
        (a.product?.name ?? '').localeCompare(b.product?.name ?? '', 'pt-BR', {
          sensitivity: 'base',
        })
      )
    case 'sector':
      return (
        fator *
        (a.sector?.name ?? '').localeCompare(b.sector?.name ?? '', 'pt-BR', {
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
    case 'location':
      return (
        fator *
        (a.location?.name ?? '').localeCompare(b.location?.name ?? '', 'pt-BR', {
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
  align,
}: {
  coluna: ColunaOrdenacao
  label: string
  colunaAtiva: ColunaOrdenacao
  direcao: DirecaoOrdenacao
  onOrdenar: (coluna: ColunaOrdenacao) => void
  align?: 'left' | 'right'
}) {
  return (
    <TableCell align={align} sortDirection={colunaAtiva === coluna ? direcao : false}>
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

export function LotesTable({ lotes, onEditar, onFechar, onChaveCopiada }: LotesTableProps) {
  const [colunaOrdenacao, setColunaOrdenacao] = useState<ColunaOrdenacao>('id')
  const [direcaoOrdenacao, setDirecaoOrdenacao] = useState<DirecaoOrdenacao>('desc')

  const lotesOrdenados = useMemo(
    () => [...lotes].sort((a, b) => compararLotes(a, b, colunaOrdenacao, direcaoOrdenacao)),
    [colunaOrdenacao, direcaoOrdenacao, lotes],
  )

  function alternarOrdenacao(coluna: ColunaOrdenacao) {
    if (colunaOrdenacao === coluna) {
      setDirecaoOrdenacao((atual) => (atual === 'asc' ? 'desc' : 'asc'))
      return
    }

    setColunaOrdenacao(coluna)
    setDirecaoOrdenacao('asc')
  }

  async function copiarChaveNfe(chave: string | number) {
    await navigator.clipboard.writeText(String(chave))
    onChaveCopiada?.()
  }

  return (
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <CabecalhoOrdenavel
              coluna="id"
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
              coluna="sector"
              label="Setor"
              colunaAtiva={colunaOrdenacao}
              direcao={direcaoOrdenacao}
              onOrdenar={alternarOrdenacao}
            />
            <CabecalhoOrdenavel
              coluna="initialQuantity"
              label="Qtd. inicial"
              colunaAtiva={colunaOrdenacao}
              direcao={direcaoOrdenacao}
              onOrdenar={alternarOrdenacao}
            />
            <CabecalhoOrdenavel
              coluna="currentQuantity"
              label="Qtd. atual"
              colunaAtiva={colunaOrdenacao}
              direcao={direcaoOrdenacao}
              onOrdenar={alternarOrdenacao}
            />
            <CabecalhoOrdenavel
              coluna="value"
              label="Valor"
              colunaAtiva={colunaOrdenacao}
              direcao={direcaoOrdenacao}
              onOrdenar={alternarOrdenacao}
            />
            <CabecalhoOrdenavel
              coluna="movementDate"
              label="Inclusão"
              colunaAtiva={colunaOrdenacao}
              direcao={direcaoOrdenacao}
              onOrdenar={alternarOrdenacao}
            />
            <CabecalhoOrdenavel
              coluna="expirationDate"
              label="Validade"
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
              coluna="location"
              label="Local"
              colunaAtiva={colunaOrdenacao}
              direcao={direcaoOrdenacao}
              onOrdenar={alternarOrdenacao}
            />
            <TableCell align="right">Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {lotesOrdenados.map((lote) => (
            <TableRow key={lote.id} hover>
              <TableCell>{lote.id}</TableCell>
              <TableCell>{lote.product?.name ?? '-'}</TableCell>
              <TableCell>{lote.sector?.name ?? '-'}</TableCell>
              <TableCell>{lote.initialQuantity}</TableCell>
              <TableCell>{lote.currentQuantity}</TableCell>
              <TableCell>{formatarValor(lote.value)}</TableCell>
              <TableCell>{formatarData(lote.movementDate)}</TableCell>
              <TableCell>{formatarData(lote.expirationDate)}</TableCell>
              <TableCell>{lote.user?.name ?? '-'}</TableCell>
              <TableCell>{lote.location?.name ?? '-'}</TableCell>
              <TableCell align="right">
                <IconButton
                  size="small"
                  aria-label="Copiar chave NF-e"
                  disabled={!lote.invoiceAccessKey}
                  onClick={() => void copiarChaveNfe(lote.invoiceAccessKey!)}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  aria-label="Editar lote"
                  onClick={() => onEditar(lote)}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  aria-label="Fechar lote"
                  disabled={lote.isClosed}
                  onClick={() => onFechar(lote)}
                >
                  <LockOutlinedIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
