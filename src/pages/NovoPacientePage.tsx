import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Alert, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PacienteForm } from '../components/PacienteForm'
import type { PacienteFormValues } from '../schemas/paciente.schema'
import { listarPlanosSaude } from '../services/health-plans.service'
import { sincronizarCarteirinhas } from '../services/insurance-cards.service'
import { criarPaciente } from '../services/patients.service'
import type { HealthPlan } from '../types/planoSaude'
import { mensagemErroApi } from '../utils/apiError'

export function NovoPacientePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [loadingDados, setLoadingDados] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [planos, setPlanos] = useState<HealthPlan[]>([])

  useEffect(() => {
    async function carregar() {
      setLoadingDados(true)
      setError(null)
      try {
        setPlanos(await listarPlanosSaude())
      } catch (err) {
        setError(mensagemErroApi(err, 'Não foi possível carregar os planos de saúde.'))
      } finally {
        setLoadingDados(false)
      }
    }
    void carregar()
  }, [])

  async function onSubmit(values: PacienteFormValues) {
    setLoading(true)
    setError(null)
    try {
      const criado = await criarPaciente({
        name: values.name,
        phone: values.phone,
        ...(values.email != null ? { email: values.email } : {}),
        ...(values.birthDate != null ? { birthDate: values.birthDate } : {}),
        ...(values.cpf != null ? { cpf: values.cpf } : {}),
      })
      await sincronizarCarteirinhas(
        criado.id,
        [],
        values.insuranceCards.map((item) => ({
          id: item.cardId,
          healthPlanId: item.healthPlanId,
          cardNumber: item.cardNumber,
          expirationDate: item.expirationDate,
        })),
      )
      navigate('/pacientes', { replace: true })
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível cadastrar o paciente.'))
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

      {loadingDados ? (
        <Stack direction="row" alignItems="center" gap={1.5}>
          <CircularProgress size={20} />
          <Typography>Carregando dados...</Typography>
        </Stack>
      ) : (
        <Stack sx={{ maxWidth: 720 }}>
          <PacienteForm
            defaultValues={{
              name: '',
              phone: '',
              email: '',
              birthDate: '',
              cpf: '',
              insuranceCards: [],
            }}
            planos={planos}
            loading={loading}
            submitLabel="Cadastrar paciente"
            onSubmit={(values) => void onSubmit(values)}
          />
        </Stack>
      )}
    </Stack>
  )
}
