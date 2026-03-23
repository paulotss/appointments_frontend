import { zodResolver } from '@hookform/resolvers/zod'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Alert, Button, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import {
  especialidadeSchema,
  type EspecialidadeFormValues,
} from '../schemas/especialidade.schema'
import { criarEspecialidade } from '../services/especialidades.service'

export function NovaEspecialidadePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EspecialidadeFormValues>({
    resolver: zodResolver(especialidadeSchema),
    defaultValues: {
      name: '',
    },
  })

  async function onSubmit(values: EspecialidadeFormValues) {
    setLoading(true)
    setError(null)
    try {
      await criarEspecialidade(values)
      reset()
      navigate('/especialidades', { replace: true })
    } catch {
      setError('Nao foi possivel cadastrar a especialidade.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Nova especialidade
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/especialidades')}
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
          label="Nome da especialidade"
          error={Boolean(errors.name)}
          helperText={errors.name?.message}
          {...register('name')}
        />
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? 'Salvando...' : 'Cadastrar especialidade'}
        </Button>
      </Stack>
    </Stack>
  )
}
