import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Alert, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ProcedimentoForm } from '../components/ProcedimentoForm'
import type { ProcedimentoFormValues } from '../schemas/procedimento.schema'
import { listarEspecialidades } from '../services/especialidades.service'
import { listarPlanosSaude } from '../services/health-plans.service'
import { criarProcedimento } from '../services/procedures.service'
import type { HealthPlan } from '../types/planoSaude'
import type { Especialidade } from '../types/registro'
import { mensagemErroApi } from '../utils/apiError'

export function NovoProcedimentoPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [loadingDados, setLoadingDados] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([])
  const [planos, setPlanos] = useState<HealthPlan[]>([])

  useEffect(() => {
    async function carregar() {
      setLoadingDados(true)
      setError(null)
      try {
        const [especialidadesData, planosData] = await Promise.all([
          listarEspecialidades(),
          listarPlanosSaude(),
        ])
        setEspecialidades(especialidadesData)
        setPlanos(planosData)
      } catch (err) {
        setError(mensagemErroApi(err, 'Não foi possível carregar os dados do procedimento.'))
      } finally {
        setLoadingDados(false)
      }
    }
    void carregar()
  }, [])

  async function onSubmit(values: ProcedimentoFormValues) {
    setLoading(true)
    setError(null)
    try {
      await criarProcedimento({
        specialtyId: values.specialtyId,
        tissCode: values.tissCode.trim(),
        name: values.name.trim(),
        value: values.value,
        healthPlanPrices: values.healthPlanPrices.length > 0 ? values.healthPlanPrices : undefined,
      })
      navigate('/procedimentos', { replace: true })
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível cadastrar o procedimento.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Novo procedimento
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/procedimentos')}
        >
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

      {!loadingDados && especialidades.length === 0 ? (
        <Alert severity="warning">Cadastre especialidades antes de cadastrar um procedimento.</Alert>
      ) : null}

      {!loadingDados && especialidades.length > 0 ? (
        <Stack sx={{ maxWidth: 640 }}>
          <ProcedimentoForm
            defaultValues={{
              specialtyId: undefined,
              tissCode: '',
              name: '',
              value: undefined,
              healthPlanPrices: [],
            }}
            especialidades={especialidades}
            planos={planos}
            loading={loading}
            submitLabel="Cadastrar procedimento"
            onSubmit={(values) => void onSubmit(values)}
          />
        </Stack>
      ) : null}
    </Stack>
  )
}
