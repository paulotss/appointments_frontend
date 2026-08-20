import { zodResolver } from '@hookform/resolvers/zod'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Alert, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { SaidaForm } from '../components/SaidaForm'
import { saidaSchema, type SaidaFormValues } from '../schemas/saida.schema'
import { getLoggedUserId } from '../services/authStorage'
import { listarProfissionais } from '../services/health-professionals.service'
import { listarProdutos } from '../services/products.service'
import { listarLotes } from '../services/stock-batches.service'
import { criarSaida } from '../services/stock-exits.service'
import type { LoteEstoque, ProdutoConfig } from '../types/estoque'
import type { HealthProfessional } from '../types/profissional'
import { toDataInputISO } from '../utils/loteForm'
import { paraUnidadesBase } from '../utils/stockUnit'

function dataHojeISO(): string {
  return toDataInputISO(new Date().toISOString())
}

export function NovaSaidaPage() {
  const navigate = useNavigate()
  const loggedUserId = getLoggedUserId()
  const [loading, setLoading] = useState(false)
  const [loadingDados, setLoadingDados] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [produtos, setProdutos] = useState<ProdutoConfig[]>([])
  const [lotes, setLotes] = useState<LoteEstoque[]>([])
  const [profissionais, setProfissionais] = useState<HealthProfessional[]>([])

  const {
    register,
    handleSubmit,
    reset,
    control,
    trigger,
    resetField,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SaidaFormValues>({
    resolver: zodResolver(saidaSchema),
    defaultValues: {
      productId: undefined,
      locationId: undefined,
      batchId: undefined,
      quantity: undefined,
      unit: 'UNIT',
      healthProfessionalId: null,
    },
  })

  useEffect(() => {
    async function carregarDados() {
      setLoadingDados(true)
      setError(null)
      try {
        const [produtosData, lotesData, profissionaisData] = await Promise.all([
          listarProdutos(),
          listarLotes(),
          listarProfissionais({ limit: 100 }),
        ])
        setProdutos(produtosData.filter((produto) => produto.isActive))
        setLotes(lotesData.filter((lote) => lote.currentQuantity > 0))
        setProfissionais(profissionaisData.data.filter((profissional) => profissional.isActive))
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

    const lote = lotes.find((item) => item.id === values.batchId)
    if (lote == null) {
      setError('Lote selecionado nao encontrado.')
      return
    }

    const produto = produtos.find((item) => item.id === values.productId)
    const unitsPerPackage =
      produto?.unitsPerPackage ?? lote.product?.unitsPerPackage ?? 1
    const quantidadeBase = paraUnidadesBase(values.quantity, values.unit, unitsPerPackage)

    if (quantidadeBase > lote.currentQuantity) {
      setError('Quantidade maior que o saldo disponivel.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      await criarSaida({
        batchId: values.batchId,
        quantity: values.quantity,
        unit: values.unit,
        userId: loggedUserId,
        exitDate: dataHojeISO(),
        ...(values.healthProfessionalId != null
          ? { healthProfessionalId: values.healthProfessionalId }
          : {}),
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
            trigger={trigger}
            resetField={resetField}
            setValue={setValue}
            watch={watch}
            produtos={produtos}
            lotes={lotes}
            profissionais={profissionais}
            loading={loading}
            submitLabel="Cadastrar saida"
          />
        </Stack>
      ) : null}
    </Stack>
  )
}
