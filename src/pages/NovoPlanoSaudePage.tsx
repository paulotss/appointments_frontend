import { zodResolver } from '@hookform/resolvers/zod'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Alert, Button, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import {
  planoSaudeSchema,
  type PlanoSaudeFormInput,
  type PlanoSaudeFormValues,
} from '../schemas/planoSaude.schema'
import { criarPlanoSaude } from '../services/health-plans.service'

export function NovoPlanoSaudePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PlanoSaudeFormInput, unknown, PlanoSaudeFormValues>({
    resolver: zodResolver(planoSaudeSchema),
    defaultValues: {
      name: '',
      submissionDeadlineDays: undefined,
    },
  })

  async function onSubmit(values: PlanoSaudeFormValues) {
    setLoading(true)
    setError(null)
    try {
      await criarPlanoSaude({
        name: values.name,
        submissionDeadlineDays: values.submissionDeadlineDays,
      })
      reset()
      navigate('/planos-saude', { replace: true })
    } catch {
      setError('Nao foi possivel cadastrar o plano de saude.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Novo plano de saude
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/planos-saude')}
        >
          Voltar para tabela
        </Button>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Stack component="form" spacing={2} sx={{ maxWidth: 540 }} onSubmit={handleSubmit(onSubmit)}>
        <TextField
          label="Nome"
          error={Boolean(errors.name)}
          helperText={errors.name?.message}
          {...register('name')}
        />
        <TextField
          label="Prazo de envio (dias)"
          type="number"
          error={Boolean(errors.submissionDeadlineDays)}
          helperText={errors.submissionDeadlineDays?.message}
          {...register('submissionDeadlineDays')}
        />
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? 'Salvando...' : 'Cadastrar plano'}
        </Button>
      </Stack>
    </Stack>
  )
}
