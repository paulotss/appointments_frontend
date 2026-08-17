import { zodResolver } from '@hookform/resolvers/zod'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Alert, Button, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { pacienteSchema, type PacienteFormInput, type PacienteFormValues } from '../schemas/paciente.schema'
import { criarPaciente } from '../services/patients.service'

export function NovoPacientePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PacienteFormInput, unknown, PacienteFormValues>({
    resolver: zodResolver(pacienteSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      birthDate: '',
      cpf: '',
    },
  })

  async function onSubmit(values: PacienteFormValues) {
    setLoading(true)
    setError(null)
    try {
      await criarPaciente({
        name: values.name,
        phone: values.phone,
        ...(values.email != null ? { email: values.email } : {}),
        ...(values.birthDate != null ? { birthDate: values.birthDate } : {}),
        ...(values.cpf != null ? { cpf: values.cpf } : {}),
      })
      reset()
      navigate('/pacientes', { replace: true })
    } catch {
      setError('Nao foi possivel cadastrar o paciente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Novo paciente
        </Typography>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/pacientes')}>
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
          label="Telefone"
          error={Boolean(errors.phone)}
          helperText={errors.phone?.message}
          {...register('phone')}
        />
        <TextField
          label="E-mail (opcional)"
          type="email"
          error={Boolean(errors.email)}
          helperText={errors.email?.message}
          {...register('email')}
        />
        <TextField
          label="Data de nascimento (opcional)"
          type="date"
          InputLabelProps={{ shrink: true }}
          error={Boolean(errors.birthDate)}
          helperText={errors.birthDate?.message}
          {...register('birthDate')}
        />
        <TextField
          label="CPF (opcional)"
          error={Boolean(errors.cpf)}
          helperText={errors.cpf?.message}
          {...register('cpf')}
        />
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? 'Salvando...' : 'Cadastrar paciente'}
        </Button>
      </Stack>
    </Stack>
  )
}
