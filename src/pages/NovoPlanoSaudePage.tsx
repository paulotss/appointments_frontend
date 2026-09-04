import { zodResolver } from '@hookform/resolvers/zod'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Alert, Button, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import {
  planoSaudeSchema,
  type PlanoSaudeFormInput,
  type PlanoSaudeFormValues,
} from '../schemas/planoSaude.schema'
import { criarPlanoSaude } from '../services/health-plans.service'
import { DEFAULT_TISS_VERSION, TISS_VERSIONS } from '../types/tiss'

export function NovoPlanoSaudePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<PlanoSaudeFormInput, unknown, PlanoSaudeFormValues>({
    resolver: zodResolver(planoSaudeSchema),
    defaultValues: {
      name: '',
      submissionDeadlineDays: undefined,
      registroAns: '',
      providerCode: '',
      tissVersion: DEFAULT_TISS_VERSION,
    },
  })

  async function onSubmit(values: PlanoSaudeFormValues) {
    setLoading(true)
    setError(null)
    try {
      await criarPlanoSaude({
        name: values.name,
        submissionDeadlineDays: values.submissionDeadlineDays,
        ...(values.registroAns ? { registroAns: values.registroAns } : {}),
        ...(values.providerCode ? { providerCode: values.providerCode } : {}),
        tissVersion: values.tissVersion,
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
        <TextField
          label="Registro ANS"
          error={Boolean(errors.registroAns)}
          helperText={errors.registroAns?.message ?? '6 dígitos da operadora'}
          {...register('registroAns')}
        />
        <TextField
          label="Código do prestador na operadora"
          error={Boolean(errors.providerCode)}
          helperText={
            errors.providerCode?.message ??
            'O XML TISS usa o CNPJ da clínica, não este código'
          }
          {...register('providerCode')}
        />
        <Controller
          name="tissVersion"
          control={control}
          render={({ field }) => (
            <TextField
              select
              label="Versão TISS"
              value={field.value}
              onChange={field.onChange}
              error={Boolean(errors.tissVersion)}
              helperText={errors.tissVersion?.message ?? 'Versão aceita pela operadora'}
            >
              {TISS_VERSIONS.map((versao) => (
                <MenuItem key={versao} value={versao}>
                  {versao}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? 'Salvando...' : 'Cadastrar plano'}
        </Button>
      </Stack>
    </Stack>
  )
}
