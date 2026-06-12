import { zodResolver } from '@hookform/resolvers/zod'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Alert, Button, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { categoriaSchema, type CategoriaFormValues } from '../schemas/categoria.schema'
import { criarCategoria } from '../services/categories.service'

export function NovaCategoriaPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoriaFormValues>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: {
      name: '',
    },
  })

  async function onSubmit(values: CategoriaFormValues) {
    setLoading(true)
    setError(null)
    try {
      await criarCategoria(values)
      reset()
      navigate('/configuracoes/estoque/categorias', { replace: true })
    } catch {
      setError('Nao foi possivel cadastrar a categoria.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Nova categoria
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/configuracoes/estoque/categorias')}
        >
          Voltar para listagem
        </Button>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Stack
        component="form"
        spacing={2}
        sx={{ maxWidth: 520 }}
        onSubmit={handleSubmit(onSubmit)}
      >
        <TextField
          label="Nome da categoria"
          error={Boolean(errors.name)}
          helperText={errors.name?.message}
          {...register('name')}
        />
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? 'Salvando...' : 'Cadastrar categoria'}
        </Button>
      </Stack>
    </Stack>
  )
}
