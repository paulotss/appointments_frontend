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
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LotesTable } from '../components/LotesTable'
import { excluirLote, listarLotes } from '../services/stock-batches.service'
import type { LoteEstoque } from '../types/estoque'

export function LotesPage() {
  const navigate = useNavigate()
  const [lotes, setLotes] = useState<LoteEstoque[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    async function carregarLotes() {
      setLoading(true)
      setError(null)
      try {
        const data = await listarLotes()
        setLotes(data)
      } catch {
        setError('Nao foi possivel carregar os lotes.')
      } finally {
        setLoading(false)
      }
    }

    void carregarLotes()
  }, [])

  function editar(lote: LoteEstoque) {
    navigate(`/estoque/lotes/${lote.id}/editar`)
  }

  async function excluir(lote: LoteEstoque) {
    const nomeProduto = lote.product?.name ?? `lote #${lote.id}`
    const confirmou = window.confirm(`Confirma excluir o lote do produto "${nomeProduto}"?`)
    if (!confirmou) return

    setError(null)
    setSuccess(null)
    try {
      await excluirLote(lote.id)
      setLotes((prev) => prev.filter((item) => item.id !== lote.id))
      setSuccess('Lote excluido com sucesso.')
    } catch {
      setError('Nao foi possivel excluir o lote.')
    }
  }

  return (
    <Stack spacing={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Lotes
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/estoque/lotes/novo')}
        >
          Novo lote
        </Button>
      </Box>

      {loading ? (
        <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress size={20} />
          <Typography>Carregando lotes...</Typography>
        </Paper>
      ) : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
      {success ? <Alert severity="success">{success}</Alert> : null}

      {!loading && !error && lotes.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography>Nenhum lote encontrado.</Typography>
        </Paper>
      ) : null}

      {!loading && !error && lotes.length > 0 ? (
        <Paper sx={{ p: 0 }}>
          <LotesTable lotes={lotes} onEditar={editar} onExcluir={excluir} />
        </Paper>
      ) : null}
    </Stack>
  )
}
