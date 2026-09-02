import { zodResolver } from '@hookform/resolvers/zod'
import AddIcon from '@mui/icons-material/Add'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import {
  Alert,
  Button,
  CircularProgress,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import {
  profissionalSchema,
  type ProfissionalFormInput,
  type ProfissionalFormValues,
} from '../schemas/profissional.schema'
import { listarEspecialidades } from '../services/especialidades.service'
import { criarProfissional } from '../services/health-professionals.service'
import { COUNCIL_TYPES } from '../types/profissional'
import { mensagemErroApi } from '../utils/apiError'
import { UFS_BRASIL } from '../utils/ufBrasil'
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
      specialties: [{ specialtyId: undefined }],
      councilType: 'CRM',
      councilNumber: '',
      councilUf: 'SP',
      cbosCode: '',
      cpf: '',
      phone: '',
      email: '',
      isActive: true,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'specialties',
  })

  const specialtiesWatch = useWatch({ control, name: 'specialties' })

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
        specialties: values.specialties,
        councilType: values.councilType,
        councilNumber: values.councilNumber,
        councilUf: values.councilUf,
        cbosCode: values.cbosCode,
        cpf: values.cpf,
        isActive: values.isActive,
        ...(values.phone != null ? { phone: values.phone } : {}),
        ...(values.email != null ? { email: values.email } : {}),
      })
      reset()
      navigate('/profissionais', { replace: true })
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível cadastrar o profissional.'))
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
        <Stack component="form" spacing={2} sx={{ maxWidth: 640 }} onSubmit={handleSubmit(onSubmit)}>
          <TextField
            label="Nome"
            error={Boolean(errors.name)}
            helperText={errors.name?.message}
            {...register('name')}
          />
          <Typography variant="subtitle2" fontWeight={700}>
            Especialidades
          </Typography>
          {errors.specialties?.root?.message || errors.specialties?.message ? (
            <Alert severity="error">
              {errors.specialties.root?.message ?? errors.specialties.message}
            </Alert>
          ) : null}
          {fields.map((field, index) => {
            const selecionados = (specialtiesWatch ?? [])
              .map((item, itemIndex) => (itemIndex === index ? undefined : item?.specialtyId))
              .filter((id): id is number => typeof id === 'number')
            const opcoes = especialidades.filter(
              (esp) =>
                !selecionados.includes(esp.id) ||
                esp.id === specialtiesWatch?.[index]?.specialtyId,
            )
            const itemError = errors.specialties?.[index]

            return (
              <Stack key={field.id} direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="flex-start">
                <Controller
                  name={`specialties.${index}.specialtyId`}
                  control={control}
                  render={({ field: specialtyField }) => (
                    <TextField
                      select
                      label="Especialidade"
                      value={specialtyField.value ?? ''}
                      onChange={(event) => specialtyField.onChange(Number(event.target.value))}
                      error={Boolean(itemError?.specialtyId)}
                      helperText={itemError?.specialtyId?.message ?? ' '}
                      sx={{ flex: 1, minWidth: 220 }}
                    >
                      <MenuItem value="" disabled>
                        Selecione uma especialidade
                      </MenuItem>
                      {opcoes.map((esp) => (
                        <MenuItem key={esp.id} value={esp.id}>
                          {esp.nome}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
                <IconButton
                  aria-label="Remover especialidade"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                  sx={{ mt: 0.5 }}
                >
                  <DeleteOutlineIcon />
                </IconButton>
              </Stack>
            )
          })}
          <Button
            type="button"
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => append({ specialtyId: undefined as unknown as number })}
            disabled={fields.length >= especialidades.length}
            sx={{ alignSelf: 'flex-start' }}
          >
            Adicionar especialidade
          </Button>
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
          <Controller
            name="councilUf"
            control={control}
            render={({ field }) => (
              <TextField
                select
                label="UF do conselho"
                value={field.value ?? ''}
                onChange={field.onChange}
                error={Boolean(errors.councilUf)}
                helperText={errors.councilUf?.message}
              >
                {UFS_BRASIL.map((uf) => (
                  <MenuItem key={uf} value={uf}>
                    {uf}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          <TextField
            label="CBO-S"
            error={Boolean(errors.cbosCode)}
            helperText={errors.cbosCode?.message ?? '6 dígitos da ocupação'}
            {...register('cbosCode')}
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
