import { zodResolver } from '@hookform/resolvers/zod'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import {
  Alert,
  Button,
  CircularProgress,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import {
  profissionalSchema,
  type ProfissionalFormInput,
  type ProfissionalFormValues,
} from '../schemas/profissional.schema'
import { listarEspecialidades } from '../services/especialidades.service'
import { criarProfissional } from '../services/health-professionals.service'
import { COUNCIL_TYPES } from '../types/profissional'
import type { Especialidade } from '../types/registro'

export function NovoProfissionalPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [loadingEspecialidades, setLoadingEspecialidades] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([])

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfissionalFormInput, unknown, ProfissionalFormValues>({
    resolver: zodResolver(profissionalSchema),
    defaultValues: {
      name: '',
      specialtyId: undefined,
      councilType: 'CRM',
      councilNumber: '',
      cpf: '',
      phone: '',
      email: '',
      isActive: true,
    },
  })

  useEffect(() => {
    async function carregarEspecialidades() {
      setLoadingEspecialidades(true)
      setError(null)
      try {
        const data = await listarEspecialidades()
        setEspecialidades(data)
      } catch {
        setError('Nao foi possivel carregar as especialidades.')
      } finally {
        setLoadingEspecialidades(false)
      }
    }

    void carregarEspecialidades()
  }, [])

  async function onSubmit(values: ProfissionalFormValues) {
    setLoading(true)
    setError(null)
    try {
      await criarProfissional({
        name: values.name,
        specialtyId: values.specialtyId,
        councilType: values.councilType,
        councilNumber: values.councilNumber,
        cpf: values.cpf,
        isActive: values.isActive,
        ...(values.phone != null ? { phone: values.phone } : {}),
        ...(values.email != null ? { email: values.email } : {}),
      })
      reset()
      navigate('/profissionais', { replace: true })
    } catch {
      setError('Nao foi possivel cadastrar o profissional.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Novo profissional
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/profissionais')}
        >
          Voltar para tabela
        </Button>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {loadingEspecialidades ? (
        <Stack direction="row" alignItems="center" gap={1.5}>
          <CircularProgress size={20} />
          <Typography>Carregando especialidades...</Typography>
        </Stack>
      ) : null}

      {!loadingEspecialidades && especialidades.length === 0 ? (
        <Alert severity="warning">
          Cadastre especialidades antes de cadastrar um profissional.
        </Alert>
      ) : null}

      {!loadingEspecialidades && especialidades.length > 0 ? (
        <Stack component="form" spacing={2} sx={{ maxWidth: 540 }} onSubmit={handleSubmit(onSubmit)}>
          <TextField
            label="Nome"
            error={Boolean(errors.name)}
            helperText={errors.name?.message}
            {...register('name')}
          />
          <Controller
            name="specialtyId"
            control={control}
            render={({ field }) => (
              <TextField
                select
                label="Especialidade"
                value={field.value ?? ''}
                onChange={(event) => field.onChange(Number(event.target.value))}
                error={Boolean(errors.specialtyId)}
                helperText={errors.specialtyId?.message}
              >
                <MenuItem value="" disabled>
                  Selecione uma especialidade
                </MenuItem>
                {especialidades.map((esp) => (
                  <MenuItem key={esp.id} value={esp.id}>
                    {esp.nome}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          <Controller
            name="councilType"
            control={control}
            render={({ field }) => (
              <TextField
                select
                label="Tipo de conselho"
                value={field.value}
                onChange={field.onChange}
                error={Boolean(errors.councilType)}
                helperText={errors.councilType?.message}
              >
                {COUNCIL_TYPES.map((tipo) => (
                  <MenuItem key={tipo} value={tipo}>
                    {tipo}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          <TextField
            label="Numero do conselho"
            error={Boolean(errors.councilNumber)}
            helperText={errors.councilNumber?.message}
            {...register('councilNumber')}
          />
          <TextField
            label="CPF"
            error={Boolean(errors.cpf)}
            helperText={errors.cpf?.message}
            {...register('cpf')}
          />
          <TextField
            label="Telefone (opcional)"
            error={Boolean(errors.phone)}
            helperText={errors.phone?.message}
            {...register('phone')}
          />
          <TextField
            label="E-mail (opcional)"
            error={Boolean(errors.email)}
            helperText={errors.email?.message}
            {...register('email')}
          />
          <FormControlLabel
            control={
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <Switch checked={field.value} onChange={(_, checked) => field.onChange(checked)} />
                )}
              />
            }
            label="Ativo"
          />
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Salvando...' : 'Cadastrar profissional'}
          </Button>
        </Stack>
      ) : null}
    </Stack>
  )
}
