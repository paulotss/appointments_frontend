import { zodResolver } from '@hookform/resolvers/zod'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Alert, Button, FormControlLabel, Stack, Switch, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { usuarioSchema, type UsuarioFormValues } from '../schemas/usuario.schema'
import { criarUsuario } from '../services/users.service'

export function NovoUsuarioPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UsuarioFormValues>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      name: '',
      usernameLogin: '',
      passwordHash: '',
      isAdmin: false,
    },
  })

  async function onSubmit(values: UsuarioFormValues) {
    setLoading(true)
    setError(null)
    try {
      await criarUsuario(values)
      reset()
      navigate('/usuarios', { replace: true })
    } catch {
      setError('Nao foi possivel cadastrar o usuario.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Novo usuario
        </Typography>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/usuarios')}>
          Voltar para tabela
        </Button>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Stack component="form" spacing={2} sx={{ maxWidth: 540 }} onSubmit={handleSubmit(onSubmit)}>
        <TextField label="Nome" error={Boolean(errors.name)} helperText={errors.name?.message} {...register('name')} />
        <TextField
          label="Usuario de login"
          error={Boolean(errors.usernameLogin)}
          helperText={errors.usernameLogin?.message}
          {...register('usernameLogin')}
        />
        <TextField
          label="Senha"
          type="password"
          error={Boolean(errors.passwordHash)}
          helperText={errors.passwordHash?.message}
          {...register('passwordHash')}
        />
        <FormControlLabel
          control={
            <Controller
              name="isAdmin"
              control={control}
              render={({ field }) => (
                <Switch checked={field.value} onChange={(_, checked) => field.onChange(checked)} />
              )}
            />
          }
          label="Administrador"
        />
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? 'Salvando...' : 'Cadastrar usuario'}
        </Button>
      </Stack>
    </Stack>
  )
}
