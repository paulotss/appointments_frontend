import { zodResolver } from '@hookform/resolvers/zod'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Alert, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { SaidaForm } from '../components/SaidaForm'
import { saidaSchema, type SaidaFormValues } from '../schemas/saida.schema'
import { getLoggedUserId } from '../services/authStorage'
import { listarLotes } from '../services/stock-batches.service'
import { criarSaida } from '../services/stock-exits.service'
import type { LoteEstoque } from '../types/estoque'
import { toDataInputISO } from '../utils/loteForm'

function dataHojeISO(): string {
  return toDataInputISO(new Date().toISOString())
}

export function NovaSaidaPage() {
  const navigate = useNavigate()
  const loggedUserId = getLoggedUserId()
  const [loading, setLoading] = useState(false)
  const [loadingDados, setLoadingDados] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lotes, setLotes] = useState<LoteEstoque[]>([])

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<SaidaFormValues>({
    resolver: zodResolver(saidaSchema),
    defaultValues: {
      batchId: undefined,
      quantity: undefined,
      exitDate: dataHojeISO(),
    },
  })

  useEffect(() => {
    async function carregarDados() {
      setLoadingDados(true)
      setError(null)
      try {
        const lotesData = await listarLotes()
        setLotes(lotesData.filter((lote) => lote.currentQuantity > 0))
      } catch {
        setError('Nao foi possivel carregar os dados do formulario.')
      } finally {
        setLoadingDados(false)
      }
    }

    void carregarDados()
  }, [])

  const formularioPronto = loggedUserId != null && lotes.length > 0

  async function onSubmit(values: SaidaFormValues) {
    if (loggedUserId == null) {
      setError('Nao foi possivel identificar o usuario logado.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      await criarSaida({
        batchId: values.batchId,
        quantity: values.quantity,
        userId: loggedUserId,
        exitDate: values.exitDate,
      })
      reset()
      navigate('/estoque/saidas', { replace: true })
    } catch {
      setError('Nao foi possivel cadastrar a saida.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Nova saida
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/estoque/saidas')}
        >
          Voltar para listagem
        </Button>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {loadingDados ? (
        <Stack direction="row" alignItems="center" gap={1.5}>
          <CircularProgress size={20} />
          <Typography>Carregando dados do formulario...</Typography>
        </Stack>
      ) : null}

      {!loadingDados && loggedUserId == null ? (
        <Alert severity="error">Nao foi possivel identificar o usuario logado.</Alert>
      ) : null}

      {!loadingDados && loggedUserId != null && lotes.length === 0 ? (
        <Alert severity="warning">Cadastre lotes com saldo antes de registrar uma saida.</Alert>
      ) : null}

      {!loadingDados && formularioPronto ? (
        <Stack component="form" onSubmit={handleSubmit(onSubmit)}>
          <SaidaForm
            register={register}
            control={control}
            errors={errors}
            lotes={lotes}
            loading={loading}
            submitLabel="Cadastrar saida"
          />
        </Stack>
      ) : null}
    </Stack>
  )
}
