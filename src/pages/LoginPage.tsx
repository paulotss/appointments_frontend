import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Box, Button, Paper, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import logoSeraphisVerde from '../assets/logo-seraphis-verde.png'
import { loginSchema, type LoginFormValues } from '../schemas/login.schema'
import { login } from '../services/auth.service'
import { isAuthenticated } from '../services/authStorage'

interface FromState {
  from?: {
    pathname?: string
  }
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [apiError, setApiError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const redirectTo = (location.state as FromState | null)?.from?.pathname ?? '/registros'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  })

  if (isAuthenticated()) {
    return <Navigate to="/registros" replace />
  }

  async function onSubmit(values: LoginFormValues) {
    setApiError(null)
    setLoading(true)
    try {
      await login(values)
      navigate(redirectTo, { replace: true })
    } catch {
      setApiError('Falha no login. Verifique suas credenciais.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        bgcolor: 'grey.100',
        p: 2,
      }}
    >
      <Paper sx={{ width: '100%', maxWidth: 420, p: 3 }}>
        <Box
          component="img"
          src={logoSeraphisVerde}
          alt="Seraphis"
          sx={{ display: 'block', width: 220, maxWidth: '100%', mx: 'auto', mb: 2 }}
        />
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Login
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Acesse para visualizar e cadastrar atendimentos.
        </Typography>

        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'grid', gap: 2 }}>
          <TextField
            label="Nome de usuario"
            fullWidth
            error={Boolean(errors.username)}
            helperText={errors.username?.message}
            {...register('username')}
          />
          <TextField
            label="Senha"
            type="password"
            fullWidth
            error={Boolean(errors.password)}
            helperText={errors.password?.message}
            {...register('password')}
          />

          {apiError ? <Alert severity="error">{apiError}</Alert> : null}

          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </Box>
      </Paper>
    </Box>
  )
}
