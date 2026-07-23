import { zodResolver } from '@hookform/resolvers/zod'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Alert, Button, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { fornecedorSchema, type FornecedorFormValues } from '../schemas/fornecedor.schema'
import { criarFornecedor } from '../services/suppliers.service'
import { apenasDigitos } from '../utils/fornecedorFormat'

export function NovoFornecedorPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FornecedorFormValues>({
    resolver: zodResolver(fornecedorSchema),
    defaultValues: {
      legalName: '',
      tradeName: '',
      cnpj: '',
      phone: '',
      email: '',
      website: '',
    },
  })

  async function onSubmit(values: FornecedorFormValues) {
    setLoading(true)
    setError(null)
    try {
      const website = values.website?.trim()
      await criarFornecedor({
        legalName: values.legalName.trim(),
        tradeName: values.tradeName.trim(),
        cnpj: apenasDigitos(values.cnpj),
        phone: apenasDigitos(values.phone) || values.phone.trim(),
        email: values.email.trim(),
        ...(website ? { website } : {}),
      })
      reset()
      navigate('/configuracoes/estoque/fornecedores', { replace: true })
    } catch {
      setError('Nao foi possivel cadastrar o fornecedor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Novo fornecedor
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/configuracoes/estoque/fornecedores')}
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
          label="Nome fantasia"
          error={Boolean(errors.tradeName)}
          helperText={errors.tradeName?.message}
          {...register('tradeName')}
        />
        <TextField
          label="Razão social"
          error={Boolean(errors.legalName)}
          helperText={errors.legalName?.message}
          {...register('legalName')}
        />
        <TextField
          label="CNPJ"
          error={Boolean(errors.cnpj)}
          helperText={errors.cnpj?.message}
          {...register('cnpj')}
        />
        <TextField
          label="Telefone"
          error={Boolean(errors.phone)}
          helperText={errors.phone?.message}
          {...register('phone')}
        />
        <TextField
          label="E-mail"
          error={Boolean(errors.email)}
          helperText={errors.email?.message}
          {...register('email')}
        />
        <TextField
          label="Website"
          error={Boolean(errors.website)}
          helperText={errors.website?.message ?? 'Opcional'}
          {...register('website')}
        />
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? 'Salvando...' : 'Cadastrar fornecedor'}
        </Button>
      </Stack>
    </Stack>
  )
}
