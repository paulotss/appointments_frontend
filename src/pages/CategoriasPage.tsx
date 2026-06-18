import AddIcon from '@mui/icons-material/Add'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CategoriasTable } from '../components/CategoriasTable'
import {
  atualizarCategoria,
  excluirCategoria,
  listarCategorias,
} from '../services/categories.service'
import type { Categoria } from '../types/estoque'

export function CategoriasPage() {
  const navigate = useNavigate()
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editando, setEditando] = useState<Categoria | null>(null)
  const [nomeEdicao, setNomeEdicao] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  function abrirEdicao(categoria: Categoria) {
    setEditando(categoria)
    setNomeEdicao(categoria.nome)
  }

  function fecharEdicao() {
    setEditando(null)
    setNomeEdicao('')
  }

  async function salvarEdicao() {
    if (!editando) return
    setSavingEdit(true)
    setError(null)
    setSuccess(null)
    try {
      const atualizado = await atualizarCategoria(editando.id, { name: nomeEdicao.trim() })
      setCategorias((prev) => prev.map((item) => (item.id === atualizado.id ? atualizado : item)))
      fecharEdicao()
      setSuccess('Categoria atualizada com sucesso.')
    } catch {
      setError('Nao foi possivel editar a categoria.')
    } finally {
      setSavingEdit(false)
    }
  }

  const nomeInvalido = nomeEdicao.trim().length < 2

  async function excluir(categoria: Categoria) {
    const confirmou = window.confirm(`Confirma excluir a categoria "${categoria.nome}"?`)
    if (!confirmou) return

    setError(null)
    setSuccess(null)
    try {
      await excluirCategoria(categoria.id)
      setCategorias((prev) => prev.filter((item) => item.id !== categoria.id))
      setSuccess('Categoria excluida com sucesso.')
    } catch {
      setError('Nao foi possivel excluir a categoria.')
    }
  }

  useEffect(() => {
    async function carregarCategorias() {
      setLoading(true)
      setError(null)
      try {
        const data = await listarCategorias()
        setCategorias(data)
      } catch {
        setError('Nao foi possivel carregar as categorias.')
      } finally {
        setLoading(false)
      }
    }

    void carregarCategorias()
  }, [])

  return (
    <Stack spacing={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Categorias
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/configuracoes/estoque/categorias/nova')}
        >
          Nova categoria
        </Button>
      </Box>

      {loading ? (
        <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress size={20} />
          <Typography>Carregando categorias...</Typography>
        </Paper>
      ) : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
      {success ? <Alert severity="success">{success}</Alert> : null}

      {!loading && !error && categorias.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography>Nenhuma categoria encontrada.</Typography>
        </Paper>
      ) : null}

      {!loading && !error && categorias.length > 0 ? (
        <Paper sx={{ p: 0 }}>
          <CategoriasTable categorias={categorias} onEditar={abrirEdicao} onExcluir={excluir} />
        </Paper>
      ) : null}

      <Dialog open={Boolean(editando)} onClose={fecharEdicao} fullWidth maxWidth="xs">
        <DialogTitle>Editar categoria</DialogTitle>
        <DialogContent>
          <TextField
            label="Nome"
            value={nomeEdicao}
            onChange={(event) => setNomeEdicao(event.target.value)}
            fullWidth
            autoFocus
            margin="dense"
            error={Boolean(nomeEdicao) && nomeInvalido}
            helperText={Boolean(nomeEdicao) && nomeInvalido ? 'Minimo 2 caracteres' : ' '}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={fecharEdicao}>Cancelar</Button>
          <Button onClick={salvarEdicao} variant="contained" disabled={savingEdit || nomeInvalido}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
