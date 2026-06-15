import { Alert, CircularProgress, Paper, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { ProdutosEstoqueTable } from '../components/ProdutosEstoqueTable'
import { listarEstoqueConsolidado } from '../services/products.service'
import type { ProdutoEstoqueConsolidado } from '../types/estoque'

export function ProdutosEstoquePage() {
  const [produtos, setProdutos] = useState<ProdutoEstoqueConsolidado[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function carregarDados() {
      setLoading(true)
      setError(null)
      try {
        const data = await listarEstoqueConsolidado()
        setProdutos(data)
      } catch {
        setError('Nao foi possivel carregar o estoque consolidado.')
      } finally {
        setLoading(false)
      }
    }

    void carregarDados()
  }, [])

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
        <Paper sx={{ p: 0 }}>
          <ProdutosEstoqueTable produtos={produtos} />
        </Paper>
      ) : null}
    </Stack>
  )
}
