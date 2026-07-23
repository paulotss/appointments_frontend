import DownloadIcon from '@mui/icons-material/Download'
import {
  Alert,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { ProdutosEstoqueTable } from '../components/ProdutosEstoqueTable'
import { listarEstoqueConsolidado } from '../services/products.service'
import { listarLocais } from '../services/storage-locations.service'
import type { LocalArmazenamento, ProdutoEstoqueConsolidado } from '../types/estoque'
import { filtrarProdutoPorLocal } from '../utils/estoqueConsolidado'

const formatadorMoeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function escaparCampoCSV(valor: string | number | null | undefined): string {
  const texto = String(valor ?? '').replace(/"/g, '""')
  return `"${texto}"`
}

function getHojeLocalISO(): string {
  const agora = new Date()
  const ano = agora.getFullYear()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

export function ProdutosEstoquePage() {
  const [produtos, setProdutos] = useState<ProdutoEstoqueConsolidado[]>([])
  const [locais, setLocais] = useState<LocalArmazenamento[]>([])
  const [buscaNome, setBuscaNome] = useState('')
  const [localFiltro, setLocalFiltro] = useState('')
  const [mostrarEstoqueZerado, setMostrarEstoqueZerado] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const produtosFiltrados = useMemo(() => {
    const termo = buscaNome.trim().toLowerCase()
    const localId = localFiltro ? Number(localFiltro) : null

    return produtos
      .map((produto) => {
        if (localId == null || Number.isNaN(localId)) {
          return produto
        }

        return filtrarProdutoPorLocal(produto, localId)
      })
      .filter((produto) => {
        if (!mostrarEstoqueZerado && produto.totalQuantity <= 0) {
          return false
        }

        if (termo && !produto.name.toLowerCase().includes(termo)) {
          return false
        }

        return true
      })
  }, [buscaNome, localFiltro, mostrarEstoqueZerado, produtos])

  const valorTotalEstoque = useMemo(() => {
    return produtosFiltrados.reduce((total, produto) => total + (produto.totalValue ?? 0), 0)
  }, [produtosFiltrados])

  useEffect(() => {
    async function carregarDados() {
      setLoading(true)
      setError(null)
      try {
        const [produtosData, locaisData] = await Promise.all([
          listarEstoqueConsolidado(),
          listarLocais(),
        ])
        setProdutos(produtosData)
        setLocais(locaisData)
      } catch {
        setError('Nao foi possivel carregar o estoque consolidado.')
      } finally {
        setLoading(false)
      }
    }

    void carregarDados()
  }, [])

  const exportarCSV = () => {
    const cabecalho = [
      'Nome',
      'SKU',
      'Quantidade total (un.)',
      'Preço médio',
      'Lotes a vencer',
      'Lotes vencidos',
      'Estoque mínimo (un.)',
    ]

    const linhas = produtosFiltrados.map((produto) =>
      [
        produto.name,
        produto.sku,
        produto.totalQuantity,
        produto.averagePrice != null ? formatadorMoeda.format(produto.averagePrice) : '-',
        produto.expiringBatchesCount,
        produto.expiredBatchesCount,
        produto.minimumStock,
      ]
        .map((campo) => escaparCampoCSV(campo))
        .join(';'),
    )

    const csv = [cabecalho.map((campo) => escaparCampoCSV(campo)).join(';'), ...linhas].join('\r\n')
    const csvComBOM = `\uFEFF${csv}`
    const blob = new Blob([csvComBOM], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `produtos-estoque-${getHojeLocalISO()}.csv`)
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={700}>
        Produtos
      </Typography>

      {loading ? (
        <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress size={20} />
          <Typography>Carregando estoque...</Typography>
        </Paper>
      ) : null}
      {error ? <Alert severity="error">{error}</Alert> : null}

      {!loading && !error && produtos.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography>Nenhum produto encontrado.</Typography>
        </Paper>
      ) : null}

      {!loading && !error && produtos.length > 0 ? (
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
            <TextField
              label="Buscar por nome"
              size="small"
              value={buscaNome}
              onChange={(event) => setBuscaNome(event.target.value)}
              sx={{ flex: 1, minWidth: { xs: '100%', md: 220 } }}
            />
            <TextField
              select
              label="Local"
              size="small"
              value={localFiltro}
              onChange={(event) => setLocalFiltro(event.target.value)}
              sx={{ minWidth: { xs: '100%', md: 220 } }}
            >
              <MenuItem value="">Todos</MenuItem>
              {locais.map((local) => (
                <MenuItem key={local.id} value={String(local.id)}>
                  {local.nome}
                </MenuItem>
              ))}
            </TextField>
            <FormControlLabel
              sx={{ width: { xs: '100%', md: 'auto' }, m: 0 }}
              control={
                <Checkbox
                  checked={mostrarEstoqueZerado}
                  onChange={(event) => setMostrarEstoqueZerado(event.target.checked)}
                />
              }
              label="Produtos com estoque zerado"
            />
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={exportarCSV}
              disabled={produtosFiltrados.length === 0}
              sx={{ width: { xs: '100%', md: 'auto' }, flexShrink: 0 }}
            >
              Exportar CSV
            </Button>
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              label={`Valor total: ${formatadorMoeda.format(valorTotalEstoque)}`}
              size="small"
              color="default"
              variant="outlined"
            />
          </Stack>

          {produtosFiltrados.length === 0 ? (
            <Paper sx={{ p: 3 }}>
              <Typography>Nenhum produto encontrado para os filtros selecionados.</Typography>
            </Paper>
          ) : (
            <Paper sx={{ p: 0 }}>
              <ProdutosEstoqueTable produtos={produtosFiltrados} />
            </Paper>
          )}
        </Stack>
      ) : null}
    </Stack>
  )
}
