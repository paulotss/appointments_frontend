import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Alert, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GuiaForm } from '../components/GuiaForm'
import type { GuiaFormValues } from '../schemas/guia.schema'
import { listarPlanosSaude } from '../services/health-plans.service'
import { criarGuia } from '../services/insurance-guides.service'
import type { HealthPlan } from '../types/planoSaude'
import { mensagemConflitoNumeroGuia, mensagemErroApi } from '../utils/apiError'
import { hojeLocalISO } from '../utils/dataISO'

export function NovaGuiaPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [loadingDados, setLoadingDados] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [planos, setPlanos] = useState<HealthPlan[]>([])
  const [formKey, setFormKey] = useState(0)
  const [guideNumberError, setGuideNumberError] = useState<string | null>(null)

  const faltamDependencias = !loadingDados && planos.length === 0

  useEffect(() => {
    async function carregarDados() {
      setLoadingDados(true)
      setError(null)
      try {
        setPlanos(await listarPlanosSaude())
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
    setGuideNumberError(null)
    try {
      await criarGuia({
        healthPlanId: values.healthPlanId,
        patientId: values.patientId,
        healthProfessionalId: values.healthProfessionalId,
        authorizationDate: values.authorizationDate,
        expirationDate: values.expirationDate,
        status: values.status,
        guideNumber: values.guideNumber,
        procedures: values.procedures.map((item) => ({
          procedureId: item.procedureId,
          authorizedQuantity: item.authorizedQuantity,
          value: item.value,
        })),
      })
      setFormKey((prev) => prev + 1)
      navigate('/guias', { replace: true })
    } catch (err) {
      const conflito = mensagemConflitoNumeroGuia(err)
      if (conflito) setGuideNumberError(conflito)
      setError(mensagemErroApi(err, 'Não foi possível cadastrar a guia.'))
    } finally {
      setLoading(false)
    }
  }

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
        <Alert severity="warning">Cadastre um plano de saúde antes de criar uma guia.</Alert>
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
              guideNumber: '',
              authorizationDate: hojeLocalISO(),
              expirationDate: '',
              procedures: [{ procedureId: undefined, authorizedQuantity: 1, value: undefined }],
            }}
            pacientes={[]}
            profissionais={[]}
            planos={planos}
            loading={loading}
            submitLabel="Cadastrar guia"
            guideNumberServerError={guideNumberError}
            onSubmit={(values) => void onSubmit(values)}
          />
        </Stack>
      ) : null}
    </Stack>
  )
}
