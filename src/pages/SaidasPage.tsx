import AddIcon from '@mui/icons-material/Add'
import DownloadIcon from '@mui/icons-material/Download'
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
import { CampoData } from '../components/CampoData'
import { listarProdutos } from '../services/products.service'
import { listarLotes, normalizarValorLote } from '../services/stock-batches.service'
import { listarSaidas } from '../services/stock-exits.service'
import { listarLocais } from '../services/storage-locations.service'
import type { SaidaEstoque } from '../types/estoque'

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

function extrairDataISO(value: string): string {
  return value.includes('T') ? value.split('T')[0] : value.split(' ')[0]
}

function formatarDataCSV(value: string | null | undefined): string {
  if (!value) return ''

  const dataParte = extrairDataISO(value)
  const [ano, mes, diaBruto] = dataParte.split('-')
  const dia = diaBruto?.slice(0, 2)

  if (!ano || !mes || !dia) return value

  return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`
}

function obterNomeProduto(
  saida: SaidaEstoque,
  produtosPorId: Record<number, string>,
): string {
  return produtosPorId[saida.batch.productId] ?? saida.batch.product?.name ?? ''
}

function obterNomeLocal(saida: SaidaEstoque, locaisPorId: Record<number, string>): string {
  return locaisPorId[saida.batch.locationId] ?? ''
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

  const exportarCSV = () => {
    const cabecalho = [
      'Produto',
      'Local',
      'Quantidade (un.)',
      'Profissional',
      'Data da saída',
      'Lote',
      'Usuário',
      'Custo unitário',
      'Valor total',
    ]

    const linhas = saidasFiltradas.map((saida) => {
      const unitCost = custoPorLoteId[saida.batchId] ?? custoPorLoteId[saida.batch.id]
      const valorTotal = unitCost != null ? unitCost * saida.quantity : null

      return [
        obterNomeProduto(saida, produtosPorId),
        obterNomeLocal(saida, locaisPorId),
        saida.quantity,
        saida.healthProfessional?.name ?? '',
        formatarDataCSV(saida.exitDate),
        saida.batchId,
        saida.user?.name ?? '',
        unitCost != null ? formatadorMoeda.format(unitCost) : '',
        valorTotal != null ? formatadorMoeda.format(valorTotal) : '',
      ]
        .map((campo) => escaparCampoCSV(campo))
        .join(';')
    })

    const csv = [cabecalho.map((campo) => escaparCampoCSV(campo)).join(';'), ...linhas].join('\r\n')
    const csvComBOM = `\uFEFF${csv}`
    const blob = new Blob([csvComBOM], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `saidas-${getHojeLocalISO()}.csv`)
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Stack spacing={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Saidas
        </Typography>
        <Stack direction="row" spacing={1} flexShrink={0}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exportarCSV}
            disabled={loading || !!error || saidasFiltradas.length === 0}
          >
            Exportar CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/estoque/saidas/nova')}
          >
            Nova saida
          </Button>
        </Stack>
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
            <CampoData
              label="Início"
              size="small"
              value={dataInicio}
              onChange={setDataInicio}
              sx={{ minWidth: { xs: '100%', md: 180 } }}
            />
            <CampoData
              label="Fim"
              size="small"
              value={dataFim}
              onChange={setDataFim}
              min={dataInicio || undefined}
              sx={{ minWidth: { xs: '100%', md: 180 } }}
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
