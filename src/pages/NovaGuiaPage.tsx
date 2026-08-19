import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Alert, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GuiaForm } from '../components/GuiaForm'
import type { GuiaFormValues } from '../schemas/guia.schema'
import { listarPlanosSaude } from '../services/health-plans.service'
import { listarProfissionais } from '../services/health-professionals.service'
import { criarGuia } from '../services/insurance-guides.service'
import { listarPacientes } from '../services/patients.service'
import type { Patient } from '../types/paciente'
import type { HealthPlan } from '../types/planoSaude'
import type { HealthProfessional } from '../types/profissional'
import { mensagemErroApi } from '../utils/apiError'
import { hojeLocalISO } from '../utils/dataISO'

export function NovaGuiaPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [loadingDados, setLoadingDados] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pacientes, setPacientes] = useState<Patient[]>([])
  const [planos, setPlanos] = useState<HealthPlan[]>([])
  const [profissionais, setProfissionais] = useState<HealthProfessional[]>([])
  const [formKey, setFormKey] = useState(0)

  const profissionaisAtivos = useMemo(
    () => profissionais.filter((item) => item.isActive),
    [profissionais],
  )

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
      } catch (err) {
        setError(mensagemErroApi(err, 'Não foi possível carregar os dados da guia.'))
      } finally {
        setLoadingDados(false)
      }
    }

    void carregarDados()
  }, [])

  async function onSubmit(values: GuiaFormValues) {
    setLoading(true)
    setError(null)
    try {
      await criarGuia({
        healthPlanId: values.healthPlanId,
        patientId: values.patientId,
        healthProfessionalId: values.healthProfessionalId,
        expirationDate: values.expirationDate,
        status: values.status,
        procedures: values.procedures.map((item) => ({
          procedureId: item.procedureId,
          authorizedQuantity: item.authorizedQuantity,
        })),
      })
      setFormKey((prev) => prev + 1)
      navigate('/guias', { replace: true })
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível cadastrar a guia.'))
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
          Cadastre pacientes, planos de saúde e profissionais ativos antes de criar uma guia.
        </Alert>
      ) : null}

      {!loadingDados && !faltamDependencias ? (
        <Stack sx={{ maxWidth: 640 }}>
          <GuiaForm
            key={formKey}
            defaultValues={{
              healthPlanId: undefined,
              patientId: undefined,
              healthProfessionalId: undefined,
              status: 'pending',
              startDate: hojeLocalISO(),
              expirationDate: '',
              procedures: [{ procedureId: undefined, authorizedQuantity: 1 }],
            }}
            pacientes={pacientes}
            profissionais={profissionais}
            planos={planos}
            loading={loading}
            submitLabel="Cadastrar guia"
            onSubmit={(values) => void onSubmit(values)}
          />
        </Stack>
      ) : null}
    </Stack>
  )
}
