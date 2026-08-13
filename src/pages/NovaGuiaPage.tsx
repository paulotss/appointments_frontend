import { zodResolver } from '@hookform/resolvers/zod'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import {
  Alert,
  Autocomplete,
  Button,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { guiaSchema, type GuiaFormInput, type GuiaFormValues } from '../schemas/guia.schema'
import { listarPlanosSaude } from '../services/health-plans.service'
import { listarProfissionais } from '../services/health-professionals.service'
import { criarGuia } from '../services/insurance-guides.service'
import { listarPacientes } from '../services/patients.service'
import type { Patient } from '../types/paciente'
import type { HealthPlan } from '../types/planoSaude'
import type { HealthProfessional } from '../types/profissional'
import { hojeMaisDiasLocal } from '../utils/dataISO'

export function NovaGuiaPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [loadingDados, setLoadingDados] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pacientes, setPacientes] = useState<Patient[]>([])
  const [planos, setPlanos] = useState<HealthPlan[]>([])
  const [profissionais, setProfissionais] = useState<HealthProfessional[]>([])

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    resetField,
    formState: { errors },
  } = useForm<GuiaFormInput, unknown, GuiaFormValues>({
    resolver: zodResolver(guiaSchema),
    defaultValues: {
      healthPlanId: undefined,
      patientId: undefined,
      healthProfessionalId: undefined,
      specialtyId: undefined,
      quantity: 1,
      expirationDate: '',
    },
  })

  const healthPlanId = useWatch({ control, name: 'healthPlanId' })
  const healthProfessionalId = useWatch({ control, name: 'healthProfessionalId' })

  const profissionaisAtivos = useMemo(
    () => profissionais.filter((item) => item.isActive),
    [profissionais],
  )

  const especialidadesDoProfissional = useMemo(() => {
    const profissional = profissionaisAtivos.find((item) => item.id === healthProfessionalId)
    return profissional?.specialties ?? []
  }, [profissionaisAtivos, healthProfessionalId])

  const prazoPlano = planos.find((item) => item.id === healthPlanId)?.submissionDeadlineDays

  useEffect(() => {
    async function carregarDados() {
      setLoadingDados(true)
      setError(null)
      try {
        const [pacientesData, planosData, profissionaisData] = await Promise.all([
          listarPacientes(),
          listarPlanosSaude(),
          listarProfissionais(),
        ])
        setPacientes(pacientesData)
        setPlanos(planosData)
        setProfissionais(profissionaisData)
      } catch {
        setError('Nao foi possivel carregar os dados da guia.')
      } finally {
        setLoadingDados(false)
      }
    }

    void carregarDados()
  }, [])

  useEffect(() => {
    if (healthPlanId == null) return
    const plano = planos.find((item) => item.id === healthPlanId)
    if (!plano) return
    setValue('expirationDate', hojeMaisDiasLocal(plano.submissionDeadlineDays))
  }, [healthPlanId, planos, setValue])

  useEffect(() => {
    resetField('specialtyId')
  }, [healthProfessionalId, resetField])

  async function onSubmit(values: GuiaFormValues) {
    setLoading(true)
    setError(null)
    try {
      await criarGuia({
        healthPlanId: values.healthPlanId,
        patientId: values.patientId,
        specialtyId: values.specialtyId,
        healthProfessionalId: values.healthProfessionalId,
        quantity: values.quantity,
        expirationDate: values.expirationDate,
      })
      reset()
      navigate('/guias', { replace: true })
    } catch {
      setError('Nao foi possivel cadastrar a guia.')
    } finally {
      setLoading(false)
    }
  }

  const faltamDependencias =
    !loadingDados && (pacientes.length === 0 || planos.length === 0 || profissionaisAtivos.length === 0)

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Nova guia
        </Typography>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/guias')}>
          Voltar para tabela
        </Button>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {loadingDados ? (
        <Stack direction="row" alignItems="center" gap={1.5}>
          <CircularProgress size={20} />
          <Typography>Carregando dados...</Typography>
        </Stack>
      ) : null}

      {faltamDependencias ? (
        <Alert severity="warning">
          Cadastre pacientes, planos de saude e profissionais ativos antes de criar uma guia.
        </Alert>
      ) : null}

      {!loadingDados && !faltamDependencias ? (
        <Stack component="form" spacing={2} sx={{ maxWidth: 560 }} onSubmit={handleSubmit(onSubmit)}>
          <Controller
            name="patientId"
            control={control}
            render={({ field: { onChange, value, ref, onBlur } }) => (
              <Autocomplete
                options={pacientes}
                getOptionLabel={(paciente) => paciente.name}
                isOptionEqualToValue={(option, selected) => option.id === selected.id}
                value={pacientes.find((paciente) => paciente.id === value) ?? null}
                onChange={(_, paciente) => onChange(paciente?.id)}
                onBlur={onBlur}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    inputRef={ref}
                    label="Paciente"
                    error={Boolean(errors.patientId)}
                    helperText={errors.patientId?.message}
                  />
                )}
              />
            )}
          />
          <Controller
            name="healthPlanId"
            control={control}
            render={({ field: { onChange, value, ref, onBlur } }) => (
              <Autocomplete
                options={planos}
                getOptionLabel={(plano) => plano.name}
                isOptionEqualToValue={(option, selected) => option.id === selected.id}
                value={planos.find((plano) => plano.id === value) ?? null}
                onChange={(_, plano) => onChange(plano?.id)}
                onBlur={onBlur}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    inputRef={ref}
                    label="Plano de saude"
                    error={Boolean(errors.healthPlanId)}
                    helperText={errors.healthPlanId?.message}
                  />
                )}
              />
            )}
          />
          <Controller
            name="healthProfessionalId"
            control={control}
            render={({ field: { onChange, value, ref, onBlur } }) => (
              <Autocomplete
                options={profissionaisAtivos}
                getOptionLabel={(profissional) => profissional.name}
                isOptionEqualToValue={(option, selected) => option.id === selected.id}
                value={profissionaisAtivos.find((profissional) => profissional.id === value) ?? null}
                onChange={(_, profissional) => onChange(profissional?.id)}
                onBlur={onBlur}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    inputRef={ref}
                    label="Profissional"
                    error={Boolean(errors.healthProfessionalId)}
                    helperText={errors.healthProfessionalId?.message}
                  />
                )}
              />
            )}
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
                helperText={
                  errors.specialtyId?.message ??
                  (healthProfessionalId == null
                    ? 'Selecione o profissional para listar as especialidades'
                    : ' ')
                }
                disabled={especialidadesDoProfissional.length === 0}
              >
                <MenuItem value="" disabled>
                  Selecione uma especialidade
                </MenuItem>
                {especialidadesDoProfissional.map((item) => (
                  <MenuItem key={item.specialtyId} value={item.specialtyId}>
                    {item.specialty?.name ?? `Especialidade ${item.specialtyId}`}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          <TextField
            label="Quantidade"
            type="number"
            inputProps={{ min: 1, step: 1 }}
            error={Boolean(errors.quantity)}
            helperText={errors.quantity?.message}
            {...register('quantity')}
          />
          <TextField
            label="Data de validade"
            type="date"
            InputLabelProps={{ shrink: true }}
            error={Boolean(errors.expirationDate)}
            helperText={
              errors.expirationDate?.message ??
              (prazoPlano != null
                ? `Sugestao com base no prazo do plano (${prazoPlano} dias). Voce pode alterar.`
                : 'Selecione o plano para sugerir a validade.')
            }
            {...register('expirationDate')}
          />
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Salvando...' : 'Cadastrar guia'}
          </Button>
        </Stack>
      ) : null}
    </Stack>
  )
}
