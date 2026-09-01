import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, CircularProgress, Paper, Stack, TextField, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { clinicaSchema, type ClinicaFormInput, type ClinicaFormValues } from '../schemas/clinica.schema'
import { atualizarPerfilClinica, buscarPerfilClinica } from '../services/clinic-profile.service'
import { mensagemErroApi } from '../utils/apiError'

export function ClinicaPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClinicaFormInput, unknown, ClinicaFormValues>({
    resolver: zodResolver(clinicaSchema),
    defaultValues: {
      legalName: '',
      cnpj: '',
      cnes: '',
    },
  })

  useEffect(() => {
    async function carregar() {
      setLoading(true)
      setError(null)
      try {
        const perfil = await buscarPerfilClinica()
        reset({
          legalName: perfil.legalName ?? '',
          cnpj: perfil.cnpj ?? '',
          cnes: perfil.cnes ?? '',
        })
      } catch (err) {
        setError(mensagemErroApi(err, 'Não foi possível carregar o cadastro da clínica.'))
      } finally {
        setLoading(false)
      }
    }
    void carregar()
  }, [reset])

  async function onSubmit(values: ClinicaFormValues) {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      await atualizarPerfilClinica({
        legalName: values.legalName,
        cnpj: values.cnpj,
        cnes: values.cnes,
      })
      setSuccess('Cadastro da clínica atualizado.')
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível salvar o cadastro da clínica.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={700}>
        Clínica
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Dados do prestador usados no XML TISS (CNES, CNPJ e razão social).
      </Typography>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {success ? <Alert severity="success">{success}</Alert> : null}

      {loading ? (
        <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress size={20} />
          <Typography>Carregando cadastro da clínica...</Typography>
        </Paper>
      ) : (
        <Stack component="form" spacing={2} sx={{ maxWidth: 540 }} onSubmit={handleSubmit(onSubmit)}>
          <TextField
            label="Razão social"
            error={Boolean(errors.legalName)}
            helperText={errors.legalName?.message}
            {...register('legalName')}
          />
          <TextField
            label="CNPJ"
            error={Boolean(errors.cnpj)}
            helperText={errors.cnpj?.message ?? '14 dígitos'}
            {...register('cnpj')}
          />
          <TextField
            label="CNES"
            error={Boolean(errors.cnes)}
            helperText={errors.cnes?.message ?? '7 dígitos'}
            {...register('cnes')}
          />
          <Button type="submit" variant="contained" disabled={saving} sx={{ alignSelf: 'flex-start' }}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </Stack>
      )}
    </Stack>
  )
}
