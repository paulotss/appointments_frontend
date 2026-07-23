import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import EditIcon from '@mui/icons-material/Edit'
import {
  Box,
  Button,
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
import type { LoteEstoque, LoteEstoqueFornecedor } from '../types/estoque'
import { normalizarValorLote } from '../services/stock-batches.service'
import { FornecedorDetalheDialog } from './FornecedorDetalheDialog'

interface LotesTableProps {
  lotes: LoteEstoque[]
  onEditar: (lote: LoteEstoque) => void
  onFechar: (lote: LoteEstoque) => void
  onChaveCopiada?: () => void
}

type ColunaOrdenacao = 'product' | 'currentQuantity' | 'location'

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
    case 'currentQuantity':
      return fator * (a.currentQuantity - b.currentQuantity)
    case 'product':
      return (
        fator *
        (a.product?.name ?? '').localeCompare(b.product?.name ?? '', 'pt-BR', {
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

function LoteRow({
  lote,
  onEditar,
  onFechar,
  onChaveCopiada,
  onAbrirFornecedor,
}: {
  lote: LoteEstoque
  onEditar: (lote: LoteEstoque) => void
  onFechar: (lote: LoteEstoque) => void
  onChaveCopiada?: () => void
  onAbrirFornecedor: (fornecedor: LoteEstoqueFornecedor) => void
}) {
  const [open, setOpen] = useState(false)

  async function copiarChaveNfe(chave: string | number) {
    await navigator.clipboard.writeText(String(chave))
    onChaveCopiada?.()
  }

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
        <TableCell>{lote.product?.name ?? '-'}</TableCell>
        <TableCell>{lote.currentQuantity}</TableCell>
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
          <IconButton size="small" aria-label="Editar lote" onClick={() => onEditar(lote)}>
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
      <TableRow>
        <TableCell colSpan={5} sx={{ py: 0, px: 0 }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ py: 1.5, px: 2, bgcolor: '#d6f4e8' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Lote</TableCell>
                    <TableCell>Setor</TableCell>
                    <TableCell>Qtd. inicial (un.)</TableCell>
                    <TableCell>Custo unit.</TableCell>
                    <TableCell>Inclusão</TableCell>
                    <TableCell>Validade</TableCell>
                    <TableCell>Usuário</TableCell>
                    <TableCell>Fornecedor</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>{lote.id}</TableCell>
                    <TableCell>{lote.sector?.name ?? '-'}</TableCell>
                    <TableCell>{lote.initialQuantity}</TableCell>
                    <TableCell>{formatarValor(lote.unitCost)}</TableCell>
                    <TableCell>{formatarData(lote.movementDate)}</TableCell>
                    <TableCell>{formatarData(lote.expirationDate)}</TableCell>
                    <TableCell>{lote.user?.name ?? '-'}</TableCell>
                    <TableCell>
                      {lote.supplier ? (
                        <Button
                          variant="text"
                          size="small"
                          onClick={() => onAbrirFornecedor(lote.supplier)}
                          sx={{ p: 0, minWidth: 0, textTransform: 'none' }}
                        >
                          {lote.supplier.tradeName}
                        </Button>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              {lote.notes ? (
                <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
                  Observações: {lote.notes}
                </Typography>
              ) : null}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </Fragment>
  )
}

export function LotesTable({ lotes, onEditar, onFechar, onChaveCopiada }: LotesTableProps) {
  const [colunaOrdenacao, setColunaOrdenacao] = useState<ColunaOrdenacao>('product')
  const [direcaoOrdenacao, setDirecaoOrdenacao] = useState<DirecaoOrdenacao>('asc')
  const [fornecedorModal, setFornecedorModal] = useState<LoteEstoqueFornecedor | null>(null)

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

  return (
    <>
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
                coluna="currentQuantity"
                label="Quantidade atual (un.)"
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
              <LoteRow
                key={lote.id}
                lote={lote}
                onEditar={onEditar}
                onFechar={onFechar}
                onChaveCopiada={onChaveCopiada}
                onAbrirFornecedor={setFornecedorModal}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <FornecedorDetalheDialog
        fornecedor={fornecedorModal}
        open={Boolean(fornecedorModal)}
        onClose={() => setFornecedorModal(null)}
      />
    </>
  )
}
