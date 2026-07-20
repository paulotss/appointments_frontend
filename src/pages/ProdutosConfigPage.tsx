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
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ProdutosConfigTable } from '../components/ProdutosConfigTable'
import { listarCategorias } from '../services/categories.service'
import { atualizarProduto, excluirProduto, listarProdutos } from '../services/products.service'
import type { Categoria, ProdutoConfig } from '../types/estoque'

export function ProdutosConfigPage() {
  const navigate = useNavigate()
  const [produtos, setProdutos] = useState<ProdutoConfig[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editando, setEditando] = useState<ProdutoConfig | null>(null)
  const [nomeEdicao, setNomeEdicao] = useState('')
  const [skuEdicao, setSkuEdicao] = useState('')
  const [categoryIdEdicao, setCategoryIdEdicao] = useState('')
  const [minimumStockEdicao, setMinimumStockEdicao] = useState('')
  const [unitsPerPackageEdicao, setUnitsPerPackageEdicao] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [buscaNome, setBuscaNome] = useState('')

  const categoriasPorId = useMemo(
    () => Object.fromEntries(categorias.map((c) => [c.id, c.nome])),
    [categorias],
  )

  const produtosFiltrados = useMemo(() => {
    const termo = buscaNome.trim().toLowerCase()
    if (!termo) return produtos

    return produtos.filter((produto) => produto.nome.toLowerCase().includes(termo))
  }, [buscaNome, produtos])

  function abrirEdicao(produto: ProdutoConfig) {
    setEditando(produto)
    setNomeEdicao(produto.nome)
    setSkuEdicao(produto.sku)
    setCategoryIdEdicao(String(produto.categoryId))
    setMinimumStockEdicao(String(produto.minimumStock))
    setUnitsPerPackageEdicao(String(produto.unitsPerPackage))
  }

  function fecharEdicao() {
    setEditando(null)
    setNomeEdicao('')
    setSkuEdicao('')
    setCategoryIdEdicao('')
    setMinimumStockEdicao('')
    setUnitsPerPackageEdicao('')
  }

  async function salvarEdicao() {
    if (!editando) return
    setSavingEdit(true)
    setError(null)
    setSuccess(null)
    try {
      const atualizado = await atualizarProduto(editando.id, {
        name: nomeEdicao.trim(),
        sku: skuEdicao.trim(),
        categoryId: Number(categoryIdEdicao),
        minimumStock: Number(minimumStockEdicao),
        unitsPerPackage: Number(unitsPerPackageEdicao),
      })
      setProdutos((prev) => prev.map((item) => (item.id === atualizado.id ? atualizado : item)))
      fecharEdicao()
      setSuccess('Produto atualizado com sucesso.')
    } catch {
      setError('Nao foi possivel editar o produto.')
    } finally {
      setSavingEdit(false)
    }
  }

  const nomeInvalido = nomeEdicao.trim().length < 2
  const skuInvalido = skuEdicao.trim().length < 1
  const categoriaInvalida = !categoryIdEdicao || Number(categoryIdEdicao) <= 0
  const estoqueInvalido =
    minimumStockEdicao.trim() === '' ||
    !Number.isInteger(Number(minimumStockEdicao)) ||
    Number(minimumStockEdicao) < 0
  const unitsPerPackageInvalido =
    unitsPerPackageEdicao.trim() === '' ||
    !Number.isInteger(Number(unitsPerPackageEdicao)) ||
    Number(unitsPerPackageEdicao) < 1

  async function excluir(produto: ProdutoConfig) {
    const confirmou = window.confirm(`Confirma inativar o produto "${produto.nome}"?`)
    if (!confirmou) return

    setError(null)
    setSuccess(null)
    try {
      await excluirProduto(produto.id)
      setProdutos((prev) => prev.filter((item) => item.id !== produto.id))
      setSuccess('Produto inativado com sucesso.')
    } catch {
      setError('Nao foi possivel inativar o produto.')
    }
  }

  useEffect(() => {
    async function carregarDados() {
      setLoading(true)
      setError(null)
      try {
        const [produtosData, categoriasData] = await Promise.all([
          listarProdutos(),
          listarCategorias(),
        ])
        setProdutos(produtosData)
        setCategorias(categoriasData)
      } catch {
        setError('Nao foi possivel carregar os produtos.')
      } finally {
        setLoading(false)
      }
    }

    void carregarDados()
  }, [])

  return (
    <Stack spacing={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Produtos
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/configuracoes/estoque/produtos/novo')}
        >
          Novo produto
        </Button>
      </Box>

      {loading ? (
        <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress size={20} />
          <Typography>Carregando produtos...</Typography>
        </Paper>
      ) : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
      {success ? <Alert severity="success">{success}</Alert> : null}

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
              <ProdutosConfigTable
                produtos={produtosFiltrados}
                categoriasPorId={categoriasPorId}
                onEditar={abrirEdicao}
                onExcluir={excluir}
              />
            </Paper>
          )}
        </Stack>
      ) : null}

      <Dialog open={Boolean(editando)} onClose={fecharEdicao} fullWidth maxWidth="sm">
        <DialogTitle>Editar produto</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 0.5 }}>
            <TextField
              label="Nome"
              value={nomeEdicao}
              onChange={(event) => setNomeEdicao(event.target.value)}
              error={Boolean(nomeEdicao) && nomeInvalido}
              helperText={Boolean(nomeEdicao) && nomeInvalido ? 'Minimo 2 caracteres' : ' '}
            />
            <TextField
              label="SKU"
              value={skuEdicao}
              onChange={(event) => setSkuEdicao(event.target.value)}
              error={Boolean(skuEdicao) && skuInvalido}
              helperText={Boolean(skuEdicao) && skuInvalido ? 'Informe o SKU' : ' '}
            />
            <TextField
              select
              label="Categoria"
              value={categoryIdEdicao}
              onChange={(event) => setCategoryIdEdicao(event.target.value)}
              error={Boolean(categoryIdEdicao) && categoriaInvalida}
              helperText={Boolean(categoryIdEdicao) && categoriaInvalida ? 'Selecione uma categoria' : ' '}
            >
              {categorias.map((categoria) => (
                <MenuItem key={categoria.id} value={String(categoria.id)}>
                  {categoria.nome}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Estoque minimo (unidades)"
              inputProps={{ inputMode: 'numeric' }}
              value={minimumStockEdicao}
              onChange={(event) => setMinimumStockEdicao(event.target.value)}
              error={Boolean(minimumStockEdicao) && estoqueInvalido}
              helperText={
                Boolean(minimumStockEdicao) && estoqueInvalido
                  ? 'Informe um inteiro maior ou igual a zero'
                  : 'Em unidade base'
              }
            />
            <TextField
              label="Unidades por caixa"
              inputProps={{ inputMode: 'numeric' }}
              value={unitsPerPackageEdicao}
              onChange={(event) => setUnitsPerPackageEdicao(event.target.value)}
              error={Boolean(unitsPerPackageEdicao) && unitsPerPackageInvalido}
              helperText={
                Boolean(unitsPerPackageEdicao) && unitsPerPackageInvalido
                  ? 'Informe um inteiro maior ou igual a 1'
                  : '1 = produto sem embalagem util'
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={fecharEdicao}>Cancelar</Button>
          <Button
            onClick={salvarEdicao}
            variant="contained"
            disabled={
              savingEdit ||
              nomeInvalido ||
              skuInvalido ||
              categoriaInvalida ||
              estoqueInvalido ||
              unitsPerPackageInvalido
            }
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
