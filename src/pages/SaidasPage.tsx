import AddIcon from '@mui/icons-material/Add'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SaidasTable } from '../components/SaidasTable'
import { listarProdutos } from '../services/products.service'
import { listarLotes, normalizarValorLote } from '../services/stock-batches.service'
import { listarSaidas } from '../services/stock-exits.service'
import { listarLocais } from '../services/storage-locations.service'
import type { SaidaEstoque } from '../types/estoque'

const formatadorMoeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function extrairDataISO(value: string): string {
  return value.includes('T') ? value.split('T')[0] : value.split(' ')[0]
}

function obterNomeProduto(
  saida: SaidaEstoque,
  produtosPorId: Record<number, string>,
): string {
  return produtosPorId[saida.batch.productId] ?? saida.batch.product?.name ?? ''
}

export function SaidasPage() {
  const navigate = useNavigate()
  const [saidas, setSaidas] = useState<SaidaEstoque[]>([])
  const [produtosPorId, setProdutosPorId] = useState<Record<number, string>>({})
  const [locaisPorId, setLocaisPorId] = useState<Record<number, string>>({})
  const [custoPorLoteId, setCustoPorLoteId] = useState<Record<number, number>>({})
  const [buscaNome, setBuscaNome] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function carregarDados() {
      setLoading(true)
      setError(null)
      try {
        const [saidasData, produtosData, locaisData, lotesData] = await Promise.all([
          listarSaidas(),
          listarProdutos(),
          listarLocais(),
          listarLotes('all'),
        ])
        setSaidas(saidasData)
        setProdutosPorId(
          Object.fromEntries(produtosData.map((produto) => [produto.id, produto.nome])),
        )
        setLocaisPorId(Object.fromEntries(locaisData.map((local) => [local.id, local.nome])))
        setCustoPorLoteId(
          Object.fromEntries(
            lotesData.flatMap((lote) => {
              const unitCost = normalizarValorLote(lote.unitCost)
              return unitCost == null ? [] : [[lote.id, unitCost]]
            }),
          ),
        )
      } catch {
        setError('Nao foi possivel carregar as saidas.')
      } finally {
        setLoading(false)
      }
    }

    void carregarDados()
  }, [])

  const saidasFiltradas = useMemo(() => {
    const termo = buscaNome.trim().toLowerCase()

    return saidas.filter((saida) => {
      const nomeProduto = obterNomeProduto(saida, produtosPorId)
      if (termo && !nomeProduto.toLowerCase().includes(termo)) {
        return false
      }

      const dataSaida = extrairDataISO(saida.exitDate)
      if (dataInicio && dataSaida < dataInicio) {
        return false
      }
      if (dataFim && dataSaida > dataFim) {
        return false
      }

      return true
    })
  }, [buscaNome, dataFim, dataInicio, produtosPorId, saidas])

  const valorTotalSaidas = useMemo(() => {
    return saidasFiltradas.reduce((total, saida) => {
      const unitCost = custoPorLoteId[saida.batchId] ?? custoPorLoteId[saida.batch.id]
      if (unitCost == null) return total
      return total + unitCost * saida.quantity
    }, 0)
  }, [custoPorLoteId, saidasFiltradas])

  return (
    <Stack spacing={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Saidas
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/estoque/saidas/nova')}
        >
          Nova saida
        </Button>
      </Box>

      {loading ? (
        <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress size={20} />
          <Typography>Carregando saidas...</Typography>
        </Paper>
      ) : null}
      {error ? <Alert severity="error">{error}</Alert> : null}

      {!loading && !error && saidas.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography>Nenhuma saida encontrada.</Typography>
        </Paper>
      ) : null}

      {!loading && !error && saidas.length > 0 ? (
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="Buscar por nome do produto"
              size="small"
              fullWidth
              value={buscaNome}
              onChange={(event) => setBuscaNome(event.target.value)}
            />
            <TextField
              type="date"
              label="Início"
              size="small"
              value={dataInicio}
              onChange={(event) => setDataInicio(event.target.value)}
              sx={{ minWidth: { xs: '100%', md: 180 } }}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              type="date"
              label="Fim"
              size="small"
              value={dataFim}
              onChange={(event) => setDataFim(event.target.value)}
              inputProps={{ min: dataInicio || undefined }}
              sx={{ minWidth: { xs: '100%', md: 180 } }}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              label={`Valor total: ${formatadorMoeda.format(valorTotalSaidas)}`}
              size="small"
              color="default"
              variant="outlined"
            />
          </Stack>

          {saidasFiltradas.length === 0 ? (
            <Paper sx={{ p: 3 }}>
              <Typography>Nenhuma saida encontrada para os filtros selecionados.</Typography>
            </Paper>
          ) : (
            <Paper sx={{ p: 0 }}>
              <SaidasTable
                saidas={saidasFiltradas}
                produtosPorId={produtosPorId}
                locaisPorId={locaisPorId}
              />
            </Paper>
          )}
        </Stack>
      ) : null}
    </Stack>
  )
}
