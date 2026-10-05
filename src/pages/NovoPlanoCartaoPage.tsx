import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Alert, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlanoCartaoForm } from '../components/PlanoCartaoForm'
import type { PlanoCartaoFormValues } from '../schemas/cartao.schema'
import { criarPlanoCartao } from '../services/benefit-plans.service'
import { listarProcedimentos } from '../services/procedures.service'
import type { Procedure } from '../types/procedimento'
import { mensagemErroApi } from '../utils/apiError'

export function NovoPlanoCartaoPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [loadingDados, setLoadingDados] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [procedimentos, setProcedimentos] = useState<Procedure[]>([])

  useEffect(() => {
    async function carregar() {
      setLoadingDados(true)
      setError(null)
      try {
        setProcedimentos(await listarProcedimentos())
      } catch (err) {
        setError(mensagemErroApi(err, 'Não foi possível carregar os procedimentos.'))
      } finally {
        setLoadingDados(false)
      }
    }
    void carregar()
  }, [])

  async function onSubmit(values: PlanoCartaoFormValues) {
    setLoading(true)
    setError(null)
    try {
      await criarPlanoCartao({
        name: values.name.trim(),
        annualPrice: values.annualPrice,
        adhesionFee: values.adhesionFee,
        dependentFee: values.dependentFee,
        isActive: values.isActive,
        benefits: values.benefits.map((benefit) =>
          benefit.kind === 'quota'
            ? {
                title: benefit.title.trim(),
                description: benefit.description?.trim() || undefined,
                kind: benefit.kind,
                quantity: benefit.quantity,
                procedureIds: benefit.procedureIds,
              }
            : {
                title: benefit.title.trim(),
                description: benefit.description?.trim() || undefined,
                kind: benefit.kind,
                discountPercent: benefit.discountPercent,
              },
        ),
      })
      navigate('/cartao/planos', { replace: true })
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível cadastrar o plano.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Novo plano do cartão
        </Typography>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/cartao/planos')}>
          Voltar para tabela
        </Button>
      </Stack>
      {error ? <Alert severity="error">{error}</Alert> : null}
      {loadingDados ? (
        <Stack direction="row" alignItems="center" gap={1.5}>
          <CircularProgress size={20} />
          <Typography>Carregando procedimentos...</Typography>
        </Stack>
      ) : null}
      {!loadingDados ? (
        <Stack sx={{ maxWidth: 720 }}>
          <PlanoCartaoForm
            procedimentos={procedimentos}
            loading={loading}
            submitLabel="Cadastrar"
            onSubmit={(values) => void onSubmit(values)}
            defaultValues={{
              name: '',
              annualPrice: 0,
              adhesionFee: 20,
              dependentFee: 5,
              isActive: true,
              benefits: [
                {
                  title: '',
                  description: '',
                  kind: 'quota',
                  quantity: 1,
                  discountPercent: 20,
                  procedureIds: [],
                },
              ],
            }}
          />
        </Stack>
      ) : null}
    </Stack>
  )
}
