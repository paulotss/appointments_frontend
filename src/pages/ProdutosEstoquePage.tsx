import { Alert, CircularProgress, Paper, Stack, TextField, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { ProdutosEstoqueTable } from '../components/ProdutosEstoqueTable'
import { listarEstoqueConsolidado } from '../services/products.service'
import type { ProdutoEstoqueConsolidado } from '../types/estoque'

export function ProdutosEstoquePage() {
  const [produtos, setProdutos] = useState<ProdutoEstoqueConsolidado[]>([])
  const [buscaNome, setBuscaNome] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const produtosFiltrados = useMemo(() => {
    const termo = buscaNome.trim().toLowerCase()
    if (!termo) return produtos

    return produtos.filter((produto) => produto.name.toLowerCase().includes(termo))
  }, [buscaNome, produtos])

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
        <Stack spacing={2}>
          <TextField
            label="Buscar por nome"
            size="small"
            fullWidth
            value={buscaNome}
            onChange={(event) => setBuscaNome(event.target.value)}
          />

          {produtosFiltrados.length === 0 ? (
            <Paper sx={{ p: 3 }}>
              <Typography>Nenhum produto encontrado para a busca.</Typography>
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
