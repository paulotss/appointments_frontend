import { zodResolver } from '@hookform/resolvers/zod'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Alert, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { SaidaForm } from '../components/SaidaForm'
import { saidaSchema, type SaidaFormValues } from '../schemas/saida.schema'
import { getLoggedUserId } from '../services/authStorage'
import { listarLotes } from '../services/stock-batches.service'
import { criarSaida } from '../services/stock-exits.service'
import { listarUsuarios } from '../services/users.service'
import type { LoteEstoque } from '../types/estoque'
import type { SystemUser } from '../types/user'
import { toDataInputISO } from '../utils/loteForm'

function dataHojeISO(): string {
  return toDataInputISO(new Date().toISOString())
}

export function NovaSaidaPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [loadingDados, setLoadingDados] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lotes, setLotes] = useState<LoteEstoque[]>([])
  const [usuarios, setUsuarios] = useState<SystemUser[]>([])

  const loggedUserId = getLoggedUserId()

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
      userId: loggedUserId ?? undefined,
      exitDate: dataHojeISO(),
    },
  })

  useEffect(() => {
    async function carregarDados() {
      setLoadingDados(true)
      setError(null)
      try {
        const [lotesData, usuariosData] = await Promise.all([listarLotes(), listarUsuarios()])
        setLotes(lotesData.filter((lote) => lote.currentQuantity > 0))
        setUsuarios(usuariosData)
      } catch {
        setError('Nao foi possivel carregar os dados do formulario.')
      } finally {
        setLoadingDados(false)
      }
    }

    void carregarDados()
  }, [])

  const formularioPronto = useMemo(
    () => lotes.length > 0 && usuarios.length > 0,
    [lotes.length, usuarios.length],
  )

  async function onSubmit(values: SaidaFormValues) {
    setLoading(true)
    setError(null)
    try {
      await criarSaida({
        batchId: values.batchId,
        quantity: values.quantity,
        userId: values.userId,
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

      {!loadingDados && !formularioPronto ? (
        <Alert severity="warning">
          Cadastre lotes com saldo e usuarios antes de registrar uma saida.
        </Alert>
      ) : null}

      {!loadingDados && formularioPronto ? (
        <Stack component="form" onSubmit={handleSubmit(onSubmit)}>
          <SaidaForm
            register={register}
            control={control}
            errors={errors}
            lotes={lotes}
            usuarios={usuarios}
            loading={loading}
            submitLabel="Cadastrar saida"
          />
        </Stack>
      ) : null}
    </Stack>
  )
}
