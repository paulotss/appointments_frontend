import AddIcon from '@mui/icons-material/Add'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SaidasTable } from '../components/SaidasTable'
import { listarProdutos } from '../services/products.service'
import { listarSaidas } from '../services/stock-exits.service'
import { listarLocais } from '../services/storage-locations.service'
import type { SaidaEstoque } from '../types/estoque'

export function SaidasPage() {
  const navigate = useNavigate()
  const [saidas, setSaidas] = useState<SaidaEstoque[]>([])
  const [produtosPorId, setProdutosPorId] = useState<Record<number, string>>({})
  const [locaisPorId, setLocaisPorId] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function carregarDados() {
      setLoading(true)
      setError(null)
      try {
        const [saidasData, produtosData, locaisData] = await Promise.all([
          listarSaidas(),
          listarProdutos(),
          listarLocais(),
        ])
        setSaidas(saidasData)
        setProdutosPorId(
          Object.fromEntries(produtosData.map((produto) => [produto.id, produto.nome])),
        )
        setLocaisPorId(Object.fromEntries(locaisData.map((local) => [local.id, local.nome])))
      } catch {
        setError('Nao foi possivel carregar as saidas.')
      } finally {
        setLoading(false)
      }
    }

    void carregarDados()
  }, [])

  const saidasOrdenadas = useMemo(
    () =>
      [...saidas].sort(
        (a, b) => new Date(b.exitDate).getTime() - new Date(a.exitDate).getTime(),
      ),
    [saidas],
  )

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

      {!loading && !error && saidasOrdenadas.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography>Nenhuma saida encontrada.</Typography>
        </Paper>
      ) : null}

      {!loading && !error && saidasOrdenadas.length > 0 ? (
        <Paper sx={{ p: 0 }}>
          <SaidasTable
            saidas={saidasOrdenadas}
            produtosPorId={produtosPorId}
            locaisPorId={locaisPorId}
          />
        </Paper>
      ) : null}
    </Stack>
  )
}
