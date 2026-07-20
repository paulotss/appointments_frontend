import AddIcon from '@mui/icons-material/Add'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LotesTable } from '../components/LotesTable'
import { fecharLote, listarLotes, normalizarValorLote } from '../services/stock-batches.service'
import type { LoteEstoque, StatusLoteFiltro } from '../types/estoque'

const formatadorMoeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function LotesPage() {
  const navigate = useNavigate()
  const [lotes, setLotes] = useState<LoteEstoque[]>([])
  const [buscaNome, setBuscaNome] = useState('')
  const [setorFiltro, setSetorFiltro] = useState('')
  const [localFiltro, setLocalFiltro] = useState('')
  const [statusFiltro, setStatusFiltro] = useState<StatusLoteFiltro>('open')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [snackbarCopiaAberto, setSnackbarCopiaAberto] = useState(false)

  useEffect(() => {
    async function carregarLotes() {
      setLoading(true)
      setError(null)
      try {
        const data = await listarLotes(statusFiltro)
        setLotes(data)
      } catch {
        setError('Nao foi possivel carregar as entradas.')
      } finally {
        setLoading(false)
      }
    }

    void carregarLotes()
  }, [statusFiltro])

  const setoresDisponiveis = useMemo(() => {
    const map = new Map<number, string>()
    for (const lote of lotes) {
      if (lote.sector) {
        map.set(lote.sector.id, lote.sector.name)
      }
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'))
  }, [lotes])

  const locaisDisponiveis = useMemo(() => {
    const map = new Map<number, string>()
    for (const lote of lotes) {
      if (lote.location) {
        map.set(lote.location.id, lote.location.name)
      }
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'))
  }, [lotes])

  const lotesFiltrados = useMemo(() => {
    const termo = buscaNome.trim().toLowerCase()

    return lotes.filter((lote) => {
      if (termo && !(lote.product?.name ?? '').toLowerCase().includes(termo)) {
        return false
      }
      if (setorFiltro && String(lote.sectorId) !== setorFiltro) {
        return false
      }
      if (localFiltro && String(lote.locationId) !== localFiltro) {
        return false
      }
      return true
    })
  }, [buscaNome, localFiltro, lotes, setorFiltro])

  const resumoFiltrado = useMemo(() => {
    let valorTotal = 0
    let quantidadeTotal = 0

    for (const lote of lotesFiltrados) {
      const unitCost = normalizarValorLote(lote.unitCost)
      if (unitCost != null) {
        valorTotal += unitCost * lote.currentQuantity
      }
      quantidadeTotal += lote.currentQuantity
    }

    return {
      valorTotal,
      quantidadeTotal,
      numeroLinhas: lotesFiltrados.length,
    }
  }, [lotesFiltrados])

  function editar(lote: LoteEstoque) {
    navigate(`/estoque/lotes/${lote.id}/editar`)
  }

  async function fechar(lote: LoteEstoque) {
    const nomeProduto = lote.product?.name ?? `entrada #${lote.id}`
    const confirmou = window.confirm(`Confirma fechar a entrada do produto "${nomeProduto}"?`)
    if (!confirmou) return

    setError(null)
    setSuccess(null)
    try {
      const loteFechado = await fecharLote(lote.id)
      setLotes((prev) => {
        if (statusFiltro === 'open') {
          return prev.filter((item) => item.id !== lote.id)
        }
        if (statusFiltro === 'all') {
          return prev.map((item) => (item.id === lote.id ? loteFechado : item))
        }
        return prev
      })
      setSuccess('Entrada fechada com sucesso.')
    } catch {
      setError('Nao foi possivel fechar a entrada.')
    }
  }

  return (
    <Stack spacing={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Entradas
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/estoque/lotes/novo')}
        >
          Nova entrada
        </Button>
      </Box>

      {loading ? (
        <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress size={20} />
          <Typography>Carregando entradas...</Typography>
        </Paper>
      ) : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
      {success ? <Alert severity="success">{success}</Alert> : null}

      {!loading && !error && lotes.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography>Nenhuma entrada encontrada.</Typography>
        </Paper>
      ) : null}

      {!loading && !error && lotes.length > 0 ? (
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="Buscar por nome do produto"
              size="small"
              value={buscaNome}
              onChange={(event) => setBuscaNome(event.target.value)}
              sx={{ flex: 1, minWidth: { xs: '100%', md: 220 } }}
            />
            <TextField
              select
              label="Status"
              size="small"
              value={statusFiltro}
              onChange={(event) => setStatusFiltro(event.target.value as StatusLoteFiltro)}
              sx={{ minWidth: { xs: '100%', md: 180 } }}
            >
              <MenuItem value="open">Abertos</MenuItem>
              <MenuItem value="closed">Fechados</MenuItem>
              <MenuItem value="all">Todos</MenuItem>
            </TextField>
            <TextField
              select
              label="Setor"
              size="small"
              value={setorFiltro}
              onChange={(event) => setSetorFiltro(event.target.value)}
              sx={{ minWidth: { xs: '100%', md: 220 } }}
            >
              <MenuItem value="">Todos</MenuItem>
              {setoresDisponiveis.map(([id, nome]) => (
                <MenuItem key={id} value={String(id)}>
                  {nome}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Local"
              size="small"
              value={localFiltro}
              onChange={(event) => setLocalFiltro(event.target.value)}
              sx={{ minWidth: { xs: '100%', md: 220 } }}
            >
              <MenuItem value="">Todos</MenuItem>
              {locaisDisponiveis.map(([id, nome]) => (
                <MenuItem key={id} value={String(id)}>
                  {nome}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              label={`Valor total: ${formatadorMoeda.format(resumoFiltrado.valorTotal)}`}
              size="small"
              color="default"
              variant="outlined"
            />
            <Chip
              label={`Quantidade total (un.): ${resumoFiltrado.quantidadeTotal}`}
              size="small"
              color="default"
              variant="outlined"
            />
            <Chip
              label={`Número de linhas: ${resumoFiltrado.numeroLinhas}`}
              size="small"
              color="default"
              variant="outlined"
            />
          </Stack>

          {lotesFiltrados.length === 0 ? (
            <Paper sx={{ p: 3 }}>
              <Typography>Nenhuma entrada encontrada para os filtros selecionados.</Typography>
            </Paper>
          ) : (
            <Paper sx={{ p: 0 }}>
              <LotesTable
                lotes={lotesFiltrados}
                onEditar={editar}
                onFechar={fechar}
                onChaveCopiada={() => setSnackbarCopiaAberto(true)}
              />
            </Paper>
          )}
        </Stack>
      ) : null}

      <Snackbar
        open={snackbarCopiaAberto}
        autoHideDuration={3000}
        onClose={() => setSnackbarCopiaAberto(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setSnackbarCopiaAberto(false)}
          sx={{ width: '100%' }}
        >
          Chave NF-e copiada para a área de transferência.
        </Alert>
      </Snackbar>
    </Stack>
  )
}
