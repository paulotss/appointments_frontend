import { zodResolver } from '@hookform/resolvers/zod'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import {
  Alert,
  Autocomplete,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { produtoSchema, type ProdutoFormValues } from '../schemas/produto.schema'
import { listarCategorias } from '../services/categories.service'
import { criarProduto } from '../services/products.service'
import type { Categoria } from '../types/estoque'

export function NovoProdutoConfigPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [loadingCategorias, setLoadingCategorias] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categorias, setCategorias] = useState<Categoria[]>([])

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ProdutoFormValues>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      name: '',
      sku: '',
      categoryId: undefined,
      minimumStock: 0,
      unitsPerPackage: 1,
    },
  })

  useEffect(() => {
    async function carregarCategorias() {
      setLoadingCategorias(true)
      try {
        const data = await listarCategorias()
        setCategorias(data)
      } catch {
        setError('Nao foi possivel carregar as categorias.')
      } finally {
        setLoadingCategorias(false)
      }
    }

    void carregarCategorias()
  }, [])

  async function onSubmit(values: ProdutoFormValues) {
    setLoading(true)
    setError(null)
    try {
      await criarProduto(values)
      reset()
      navigate('/configuracoes/estoque/produtos', { replace: true })
    } catch {
      setError('Nao foi possivel cadastrar o produto.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Novo produto
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/configuracoes/estoque/produtos')}
        >
          Voltar para listagem
        </Button>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {loadingCategorias ? (
        <Stack direction="row" alignItems="center" gap={1.5}>
          <CircularProgress size={20} />
          <Typography>Carregando categorias...</Typography>
        </Stack>
      ) : (
        <Stack
          component="form"
          spacing={2}
          sx={{ maxWidth: 520 }}
          onSubmit={handleSubmit(onSubmit)}
        >
          <TextField
            label="Nome do produto"
            error={Boolean(errors.name)}
            helperText={errors.name?.message}
            {...register('name')}
          />
          <TextField
            label="SKU"
            error={Boolean(errors.sku)}
            helperText={errors.sku?.message}
            {...register('sku')}
          />
          <Controller
            name="categoryId"
            control={control}
            rules={{ required: true }}
            render={({ field: { onChange, value, ref, onBlur } }) => (
              <Autocomplete
                options={categorias}
                getOptionLabel={(categoria) => categoria.nome}
                isOptionEqualToValue={(option, selected) => option.id === selected.id}
                value={categorias.find((categoria) => categoria.id === value) ?? null}
                onChange={(_, categoria) => onChange(categoria?.id)}
                onBlur={onBlur}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    inputRef={ref}
                    label="Categoria"
                    placeholder="Selecione uma categoria"
                    error={Boolean(errors.categoryId)}
                    helperText={errors.categoryId?.message}
                  />
                )}
              />
            )}
          />
          <TextField
            label="Estoque minimo (unidades)"
            type="number"
            inputProps={{ min: 0, step: 1 }}
            error={Boolean(errors.minimumStock)}
            helperText={errors.minimumStock?.message ?? 'Em unidade base'}
            {...register('minimumStock', { valueAsNumber: true })}
          />
          <TextField
            label="Unidades por caixa"
            type="number"
            inputProps={{ min: 1, step: 1 }}
            error={Boolean(errors.unitsPerPackage)}
            helperText={
              errors.unitsPerPackage?.message ?? '1 = produto sem embalagem util'
            }
            {...register('unitsPerPackage', { valueAsNumber: true })}
          />
          <Button type="submit" variant="contained" disabled={loading || categorias.length === 0}>
            {loading ? 'Salvando...' : 'Cadastrar produto'}
          </Button>
        </Stack>
      )}
    </Stack>
  )
}
