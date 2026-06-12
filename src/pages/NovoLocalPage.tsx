import { zodResolver } from '@hookform/resolvers/zod'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Alert, Button, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { localSchema, type LocalFormValues } from '../schemas/local.schema'
import { criarLocal } from '../services/storage-locations.service'

export function NovoLocalPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LocalFormValues>({
    resolver: zodResolver(localSchema),
    defaultValues: {
      name: '',
    },
  })

  async function onSubmit(values: LocalFormValues) {
    setLoading(true)
    setError(null)
    try {
      await criarLocal(values)
      reset()
      navigate('/configuracoes/estoque/locais', { replace: true })
    } catch {
      setError('Nao foi possivel cadastrar o local.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Novo local
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/configuracoes/estoque/locais')}
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
          label="Nome do local"
          error={Boolean(errors.name)}
          helperText={errors.name?.message}
          {...register('name')}
        />
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? 'Salvando...' : 'Cadastrar local'}
        </Button>
      </Stack>
    </Stack>
  )
}
