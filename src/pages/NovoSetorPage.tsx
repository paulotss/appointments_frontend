import { zodResolver } from '@hookform/resolvers/zod'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Alert, Button, FormControlLabel, Stack, Switch, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { setorSchema, type SetorFormValues } from '../schemas/setor.schema'
import { criarSetor } from '../services/sectors.service'

export function NovoSetorPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<SetorFormValues>({
    resolver: zodResolver(setorSchema),
    defaultValues: {
      name: '',
      isActive: true,
    },
  })

  async function onSubmit(values: SetorFormValues) {
    setLoading(true)
    setError(null)
    try {
      await criarSetor(values)
      reset()
      navigate('/configuracoes/estoque/setores', { replace: true })
    } catch {
      setError('Nao foi possivel cadastrar o setor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Novo setor
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/configuracoes/estoque/setores')}
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
          label="Nome do setor"
          error={Boolean(errors.name)}
          helperText={errors.name?.message}
          {...register('name')}
        />
        <Controller
          name="isActive"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={<Switch checked={field.value} onChange={(_, checked) => field.onChange(checked)} />}
              label="Ativo"
            />
          )}
        />
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? 'Salvando...' : 'Cadastrar setor'}
        </Button>
      </Stack>
    </Stack>
  )
}
