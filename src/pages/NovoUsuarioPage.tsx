import { zodResolver } from '@hookform/resolvers/zod'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Alert, Button, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { PacienteBuscaAutocomplete } from '../components/PacienteBuscaAutocomplete'
import { ProfissionalBuscaAutocomplete } from '../components/ProfissionalBuscaAutocomplete'
import { ROLE_LABELS, USER_ROLES } from '../routes/access'
import { usuarioSchema, type UsuarioFormInput, type UsuarioFormValues } from '../schemas/usuario.schema'
import { criarUsuario } from '../services/users.service'
import type { Patient } from '../types/paciente'
import type { HealthProfessional } from '../types/profissional'

export function NovoUsuarioPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paciente, setPaciente] = useState<Patient | null>(null)
  const [profissional, setProfissional] = useState<HealthProfessional | null>(null)

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<UsuarioFormInput, unknown, UsuarioFormValues>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      name: '',
      usernameLogin: '',
      email: '',
      passwordHash: '',
      role: 'RECEPTIONIST',
      patientId: null,
      healthProfessionalId: null,
      extension: '',
    },
  })

  const role = useWatch({ control, name: 'role' })

  async function onSubmit(values: UsuarioFormValues) {
    setLoading(true)
    setError(null)
    try {
      await criarUsuario({
        name: values.name,
        passwordHash: values.passwordHash,
        usernameLogin: values.usernameLogin,
        email: values.email,
        role: values.role,
        patientId: values.role === 'PATIENT' ? values.patientId : null,
        healthProfessionalId: values.role === 'PROFESSIONAL' ? values.healthProfessionalId : null,
        ...(values.extension != null ? { extension: values.extension } : {}),
      })
      reset()
      setPaciente(null)
      setProfissional(null)
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
          label="E-mail (opcional)"
          type="email"
          error={Boolean(errors.email)}
          helperText={errors.email?.message}
          {...register('email')}
        />
        <TextField
          label="Senha"
          type="password"
          error={Boolean(errors.passwordHash)}
          helperText={errors.passwordHash?.message}
          {...register('passwordHash')}
        />
        <TextField
          label="Ramal (opcional)"
          inputProps={{ inputMode: 'numeric' }}
          error={Boolean(errors.extension)}
          helperText={errors.extension?.message ?? 'Numero inteiro unico por atendente; deixe em branco se nao usar.'}
          {...register('extension')}
        />
        <Controller
          name="role"
          control={control}
          render={({ field }) => (
            <TextField
              select
              label="Papel"
              value={field.value}
              onChange={(event) => {
                field.onChange(event.target.value)
                setValue('patientId', null)
                setValue('healthProfessionalId', null)
                setPaciente(null)
                setProfissional(null)
              }}
            >
              {USER_ROLES.map((item) => (
                <MenuItem key={item} value={item}>
                  {ROLE_LABELS[item]}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        {role === 'PATIENT' ? (
          <PacienteBuscaAutocomplete
            value={paciente}
            onChange={(item) => {
              setPaciente(item)
              setValue('patientId', item?.id ?? null, { shouldValidate: true })
            }}
            error={Boolean(errors.patientId)}
            helperText={errors.patientId?.message}
          />
        ) : null}
        {role === 'PROFESSIONAL' ? (
          <ProfissionalBuscaAutocomplete
            value={profissional}
            onChange={(item) => {
              setProfissional(item)
              setValue('healthProfessionalId', item?.id ?? null, { shouldValidate: true })
            }}
            error={Boolean(errors.healthProfessionalId)}
            helperText={errors.healthProfessionalId?.message}
          />
        ) : null}
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? 'Salvando...' : 'Cadastrar usuario'}
        </Button>
      </Stack>
    </Stack>
  )
}
